# Document Converter

A modern, minimalist document conversion application built with Next.js 15 and FastAPI, powered by Docling.

## Features

- 🚀 **Multi-file conversion** - Convert multiple documents simultaneously
- 📁 **Drag & drop upload** - Easy file selection with duplicate detection
- 🔄 **Real-time processing** - Async conversion with live progress tracking
- 📱 **Responsive design** - Clean, minimalist interface that works on all devices
- ⚡ **Fast & efficient** - Concurrent processing with cancellation support
- 📊 **Server monitoring** - Real-time server statistics

## Supported Formats

### Input Formats
- PDF Documents
- Microsoft Word (DOCX)
- PowerPoint (PPTX)
- Excel (XLSX)
- HTML Files
- Markdown Files
- Images (JPG, PNG, GIF, BMP, TIFF)
- CSV Files
- XML Files

### Output Formats
- Markdown (.md)
- HTML (.html)
- JSON (.json)
- Plain Text (.txt)
- DocTags XML (.xml)

## Tech Stack

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend
- **FastAPI** for API server
- **Docling** for document processing
- **Python 3.13+**
- **Uvicorn** ASGI server

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.13+
- pip or conda

### Backend Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Start the FastAPI server:
```bash
python run.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `GET /formats` - Supported formats
- `POST /convert` - Synchronous conversion
- `POST /convert-async` - Asynchronous conversion
- `GET /convert-status/{job_id}` - Job status
- `GET /server-stats` - Server statistics

## Deployment

### Vercel (Frontend)

1. Connect your GitHub repository to Vercel
2. Set build command: `cd frontend && npm run build`
3. Set output directory: `frontend/.next`
4. Deploy

### Backend Deployment

The FastAPI backend can be deployed to:
- Railway
- Render
- Heroku
- DigitalOcean App Platform
- AWS/GCP/Azure

## Configuration

### Environment Variables

Backend:
- `HOST` - Server host (default: 0.0.0.0)
- `PORT` - Server port (default: 8000)
- `RELOAD` - Auto-reload (default: true)

Frontend:
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Development

### Project Structure
```
├── app/                    # FastAPI backend
│   ├── main.py            # Main application
│   ├── models.py          # Data models
│   └── utils.py           # Utilities
├── frontend/              # Next.js frontend
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── lib/               # Utilities
│   └── types/             # TypeScript types
├── requirements.txt       # Python dependencies
└── run.py                # Server launcher
```

### Key Features

- **Concurrent Processing**: Handle multiple users simultaneously
- **Async Operations**: Non-blocking document conversion
- **Real-time Updates**: Live progress tracking
- **Error Handling**: Robust error management
- **Cancellation**: Stop conversions in progress
- **Duplicate Detection**: Automatic file deduplication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions, please open a GitHub issue.
