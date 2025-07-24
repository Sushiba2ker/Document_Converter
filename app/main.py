from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import asyncio
import uuid
from pathlib import Path
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Optional

from .models import ConversionResponse, OutputFormat, HealthResponse
from .utils import DoclingConverter, save_uploaded_file, cleanup_file, get_file_info, is_supported_file

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Docling Document Converter API",
    description="API for converting documents using Docling",
    version="1.0.0"
)

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Docling converter and thread pool
try:
    docling_converter = DoclingConverter()
    logger.info("Docling converter initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Docling converter: {e}")
    docling_converter = None

# Thread pool for concurrent processing
executor = ThreadPoolExecutor(max_workers=4)  # Adjust based on server capacity

# In-memory store for conversion jobs (in production, use Redis or database)
conversion_jobs: Dict[str, Dict] = {}

@app.get("/")
async def home():
    """API root endpoint"""
    return {
        "message": "Docling Document Converter API",
        "version": "1.0.0",
        "status": "running",
        "frontend_url": "http://localhost:3000",
        "docs_url": "/docs",
        "endpoints": {
            "health": "/health",
            "convert": "/convert",
            "formats": "/formats"
        }
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy" if docling_converter else "unhealthy",
        message="Docling Document Converter is running" if docling_converter else "Docling converter not available",
        version="1.0.0"
    )

def process_document_sync(
    file_path: str,
    output_format: str,
    job_id: str
) -> None:
    """Synchronous document processing function for thread pool"""
    try:
        # Update job status
        conversion_jobs[job_id]["status"] = "processing"
        conversion_jobs[job_id]["progress"] = 10

        # Convert document
        success, result, metadata = docling_converter.convert_document(
            file_path,
            output_format
        )

        conversion_jobs[job_id]["progress"] = 90

        if success:
            conversion_jobs[job_id].update({
                "status": "completed",
                "progress": 100,
                "result": {
                    "success": True,
                    "message": "Document converted successfully",
                    "content": result,
                    "metadata": metadata
                }
            })
        else:
            conversion_jobs[job_id].update({
                "status": "failed",
                "progress": 100,
                "result": {
                    "success": False,
                    "message": "Conversion failed",
                    "error": result
                }
            })
    except Exception as e:
        conversion_jobs[job_id].update({
            "status": "failed",
            "progress": 100,
            "result": {
                "success": False,
                "message": "Internal server error",
                "error": str(e)
            }
        })
    finally:
        # Clean up file
        cleanup_file(file_path)

@app.post("/convert", response_model=ConversionResponse)
async def convert_document(
    file: UploadFile = File(...),
    output_format: OutputFormat = Form(OutputFormat.MARKDOWN),
    include_images: bool = Form(True),
    include_tables: bool = Form(True)
):
    """
    Convert uploaded document to specified format
    """
    if not docling_converter:
        raise HTTPException(status_code=500, detail="Docling converter not available")
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    if not is_supported_file(file.filename):
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Supported formats: PDF, DOCX, PPTX, XLSX, HTML, MD, Images, CSV, XML"
        )
    
    # Check file size (limit to 50MB)
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:  # 50MB
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB")
    
    file_path = None
    try:
        # Save uploaded file
        file_path = save_uploaded_file(content, file.filename)
        
        # Get file info
        file_info = get_file_info(file.filename, content)
        
        # Convert document
        success, result, metadata = docling_converter.convert_document(
            file_path, 
            output_format.value
        )
        
        if success:
            # Add file info to metadata
            if metadata:
                metadata.update(file_info)
            else:
                metadata = file_info
            
            return ConversionResponse(
                success=True,
                message="Document converted successfully",
                content=result,
                metadata=metadata
            )
        else:
            return ConversionResponse(
                success=False,
                message="Conversion failed",
                error=result
            )
    
    except Exception as e:
        logger.error(f"Error in convert_document: {e}")
        return ConversionResponse(
            success=False,
            message="Internal server error",
            error=str(e)
        )
    
    finally:
        # Clean up temporary file
        if file_path:
            cleanup_file(file_path)

@app.post("/convert-async")
async def convert_document_async(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    output_format: OutputFormat = Form(OutputFormat.MARKDOWN),
    include_images: bool = Form(True),
    include_tables: bool = Form(True)
):
    """
    Start asynchronous document conversion and return job ID
    """
    if not docling_converter:
        raise HTTPException(status_code=500, detail="Docling converter not available")

    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    if not is_supported_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Supported formats: PDF, DOCX, PPTX, XLSX, HTML, MD, Images, CSV, XML"
        )

    # Check file size (limit to 50MB)
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:  # 50MB
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB")

    try:
        # Save uploaded file
        file_path = save_uploaded_file(content, file.filename)

        # Generate job ID
        job_id = str(uuid.uuid4())

        # Initialize job status
        conversion_jobs[job_id] = {
            "status": "queued",
            "progress": 0,
            "filename": file.filename,
            "output_format": output_format.value,
            "created_at": asyncio.get_event_loop().time()
        }

        # Submit to thread pool
        loop = asyncio.get_event_loop()
        loop.run_in_executor(
            executor,
            process_document_sync,
            file_path,
            output_format.value,
            job_id
        )

        return {
            "job_id": job_id,
            "status": "queued",
            "message": "Conversion job started"
        }

    except Exception as e:
        logger.error(f"Error in convert_document_async: {e}")
        raise HTTPException(status_code=500, detail="Failed to start conversion job")

@app.get("/convert-status/{job_id}")
async def get_conversion_status(job_id: str):
    """
    Get the status of a conversion job
    """
    if job_id not in conversion_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = conversion_jobs[job_id]

    # Clean up completed jobs older than 1 hour
    current_time = asyncio.get_event_loop().time()
    if (job["status"] in ["completed", "failed"] and
        current_time - job["created_at"] > 3600):
        del conversion_jobs[job_id]
        raise HTTPException(status_code=404, detail="Job expired")

    return {
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "filename": job["filename"],
        "result": job.get("result")
    }

@app.get("/formats")
async def get_supported_formats():
    """Get list of supported input and output formats"""
    return {
        "input_formats": [
            "PDF", "DOCX", "PPTX", "XLSX", "HTML", "MD", 
            "Images (JPG, PNG, GIF, BMP, TIFF)", "CSV", "XML"
        ],
        "output_formats": [
            {"value": "markdown", "label": "Markdown"},
            {"value": "html", "label": "HTML"},
            {"value": "json", "label": "JSON"},
            {"value": "text", "label": "Plain Text"},
            {"value": "doctags", "label": "DocTags"}
        ]
    }

@app.get("/server-stats")
async def get_server_stats():
    """Get server statistics for monitoring"""
    active_jobs = len([job for job in conversion_jobs.values() if job["status"] in ["queued", "processing"]])
    completed_jobs = len([job for job in conversion_jobs.values() if job["status"] == "completed"])
    failed_jobs = len([job for job in conversion_jobs.values() if job["status"] == "failed"])

    return {
        "active_jobs": active_jobs,
        "completed_jobs": completed_jobs,
        "failed_jobs": failed_jobs,
        "total_jobs": len(conversion_jobs),
        "max_workers": executor._max_workers,
        "queue_size": executor._work_queue.qsize() if hasattr(executor._work_queue, 'qsize') else 0
    }

@app.exception_handler(413)
async def request_entity_too_large(request, exc):
    """Handle file too large error"""
    return JSONResponse(
        status_code=413,
        content={"detail": "File too large. Maximum size is 50MB"}
    )

@app.exception_handler(500)
async def internal_server_error(request, exc):
    """Handle internal server errors"""
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    # Create necessary directories
    Path("static/uploads").mkdir(parents=True, exist_ok=True)

    # Run the application
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
