import os
import tempfile
import shutil
import ssl
import certifi
from pathlib import Path
from typing import Optional, Tuple
from docling.document_converter import DocumentConverter
from docling_core.types.doc import DoclingDocument
import logging

# Fix SSL certificate issues
os.environ['SSL_CERT_FILE'] = certifi.where()
os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()

# Create unverified SSL context as fallback
ssl._create_default_https_context = ssl._create_unverified_context

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DoclingConverter:
    """Wrapper class for Docling document conversion"""
    
    def __init__(self):
        """Initialize the document converter"""
        try:
            # Try to initialize with offline-friendly configuration
            from docling.datamodel.pipeline_options import PdfPipelineOptions
            from docling.datamodel.base_models import InputFormat
            from docling.document_converter import DocumentConverter, PdfFormatOption

            # Configure pipeline to avoid downloading models if possible
            pipeline_options = PdfPipelineOptions()
            pipeline_options.do_ocr = False  # Disable OCR to avoid model downloads

            format_options = {
                InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
            }

            self.converter = DocumentConverter(format_options=format_options)
            logger.info("Docling DocumentConverter initialized successfully")
        except Exception as e:
            logger.warning(f"Failed to initialize with custom options: {e}")
            try:
                # Fallback to default initialization
                self.converter = DocumentConverter()
                logger.info("Docling DocumentConverter initialized with default settings")
            except Exception as e2:
                logger.error(f"Failed to initialize DocumentConverter: {e2}")
                raise

    def convert_document(self, file_path: str, output_format: str = "markdown") -> Tuple[bool, str, Optional[dict]]:
        """
        Convert document to specified format
        
        Args:
            file_path: Path to the input document
            output_format: Output format (markdown, html, json, text, doctags)
            
        Returns:
            Tuple of (success, content/error_message, metadata)
        """
        try:
            # Convert document
            logger.info(f"Converting document: {file_path}")
            result = self.converter.convert(file_path)
            
            if not result.document:
                return False, "Failed to convert document", None
            
            doc: DoclingDocument = result.document
            
            # Extract content based on format
            if output_format == "markdown":
                content = doc.export_to_markdown()
            elif output_format == "html":
                content = doc.export_to_html()
            elif output_format == "json":
                content = doc.export_to_dict()
                # Convert to JSON string for consistent return type
                import json
                content = json.dumps(content, indent=2, ensure_ascii=False)
            elif output_format == "text":
                # Extract plain text from all text items
                content = self._extract_plain_text(doc)
            elif output_format == "doctags":
                content = doc.export_to_doctags()
                # Convert to string representation
                content = str(content)
            else:
                return False, f"Unsupported output format: {output_format}", None
            
            # Prepare metadata
            metadata = {
                "pages": len(doc.pages) if doc.pages else 0,
                "tables": len(doc.tables) if doc.tables else 0,
                "pictures": len(doc.pictures) if doc.pictures else 0,
                "conversion_status": str(result.status) if hasattr(result, 'status') else "success"
            }
            
            logger.info(f"Document converted successfully to {output_format}")
            return True, content, metadata
            
        except Exception as e:
            error_msg = f"Error converting document: {str(e)}"
            logger.error(error_msg)
            return False, error_msg, None
    
    def _extract_plain_text(self, doc: DoclingDocument) -> str:
        """Extract plain text from document"""
        try:
            text_parts = []
            
            # Extract text from all text items
            if hasattr(doc, 'texts') and doc.texts:
                for text_item in doc.texts:
                    if hasattr(text_item, 'text'):
                        text_parts.append(text_item.text)
            
            # If no text items, try to get text from body
            if not text_parts and hasattr(doc, 'body'):
                # This is a fallback method
                text_parts.append(str(doc.body))
            
            return "\n\n".join(text_parts) if text_parts else "No text content found"
            
        except Exception as e:
            logger.error(f"Error extracting plain text: {e}")
            return f"Error extracting text: {str(e)}"

def save_uploaded_file(file_content: bytes, filename: str) -> str:
    """
    Save uploaded file to temporary directory
    
    Args:
        file_content: File content as bytes
        filename: Original filename
        
    Returns:
        Path to saved file
    """
    try:
        # Create uploads directory if it doesn't exist
        upload_dir = Path("static/uploads")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Create temporary file with original extension
        file_extension = Path(filename).suffix
        temp_file = tempfile.NamedTemporaryFile(
            delete=False, 
            suffix=file_extension,
            dir=upload_dir
        )
        
        # Write content to file
        temp_file.write(file_content)
        temp_file.close()
        
        logger.info(f"File saved: {temp_file.name}")
        return temp_file.name
        
    except Exception as e:
        logger.error(f"Error saving file: {e}")
        raise

def cleanup_file(file_path: str) -> None:
    """
    Clean up temporary file
    
    Args:
        file_path: Path to file to delete
    """
    try:
        if os.path.exists(file_path):
            os.unlink(file_path)
            logger.info(f"Cleaned up file: {file_path}")
    except Exception as e:
        logger.error(f"Error cleaning up file {file_path}: {e}")

def get_file_info(filename: str, content: bytes) -> dict:
    """
    Get file information
    
    Args:
        filename: Original filename
        content: File content
        
    Returns:
        Dictionary with file information
    """
    return {
        "filename": filename,
        "size": len(content),
        "extension": Path(filename).suffix.lower(),
        "size_mb": round(len(content) / (1024 * 1024), 2)
    }

def is_supported_file(filename: str) -> bool:
    """
    Check if file type is supported
    
    Args:
        filename: Filename to check
        
    Returns:
        True if supported, False otherwise
    """
    supported_extensions = {
        '.pdf', '.docx', '.pptx', '.xlsx', '.html', '.htm', 
        '.md', '.txt', '.csv', '.xml', '.jpg', '.jpeg', 
        '.png', '.gif', '.bmp', '.tiff', '.tif'
    }
    
    extension = Path(filename).suffix.lower()
    return extension in supported_extensions
