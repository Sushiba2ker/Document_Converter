from pydantic import BaseModel
from typing import Optional, List
from enum import Enum

class OutputFormat(str, Enum):
    """Supported output formats"""
    MARKDOWN = "markdown"
    HTML = "html"
    JSON = "json"
    TEXT = "text"
    DOCTAGS = "doctags"

class ConversionRequest(BaseModel):
    """Request model for document conversion"""
    output_format: OutputFormat = OutputFormat.MARKDOWN
    include_images: bool = True
    include_tables: bool = True

class ConversionResponse(BaseModel):
    """Response model for document conversion"""
    success: bool
    message: str
    content: Optional[str] = None
    metadata: Optional[dict] = None
    error: Optional[str] = None

class FileInfo(BaseModel):
    """File information model"""
    filename: str
    size: int
    content_type: str

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    message: str
    version: str
