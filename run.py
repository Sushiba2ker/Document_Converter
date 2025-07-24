#!/usr/bin/env python3
"""
Docling Document Converter Web Application
Run script for starting the FastAPI server
"""

import uvicorn
import os
from pathlib import Path

def create_directories():
    """Create necessary directories if they don't exist"""
    directories = [
        "static/uploads"
    ]

    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✓ Created directory: {directory}")

def main():
    """Main function to run the application"""
    print("🚀 Starting Docling Document Converter...")
    
    # Create necessary directories
    create_directories()
    
    # Configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("RELOAD", "true").lower() == "true"
    
    print(f"📡 Server will run on: http://{host}:{port}")
    print(f"🔄 Auto-reload: {'enabled' if reload else 'disabled'}")
    print("📁 Upload directory: static/uploads")
    print("🔧 Concurrent processing: enabled")
    print("⚡ Async conversion: enabled")
    print("\n" + "="*50)
    print("🌐 API Documentation: http://localhost:8000/docs")
    print("🌐 Frontend (Next.js): http://localhost:3000")
    print("📊 Server Stats: Available in frontend (bottom-right)")
    print("="*50 + "\n")
    
    # Run the server
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )

if __name__ == "__main__":
    main()
