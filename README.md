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

### Docker Deployment on EC2 Ubuntu

#### Quick Deploy (Recommended)

1. **Prepare your EC2 instance:**

   - Ubuntu 20.04 LTS or 22.04 LTS
   - Minimum t3.medium (2 vCPU, 4GB RAM)
   - Security Group: Open ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

2. **Option A: One-command deployment (installs Docker + deploys app):**

   ```bash
   ./deploy-docker-ec2.sh YOUR_EC2_IP ~/.ssh/your-key.pem
   ```

3. **Option B: Two-step deployment (recommended for production):**

   ```bash
   # Step 1: Setup EC2 with Docker
   ./setup-ec2-docker.sh YOUR_EC2_IP ~/.ssh/your-key.pem

   # Step 2: Deploy application
   ./deploy-docker-ec2.sh YOUR_EC2_IP ~/.ssh/your-key.pem
   ```

4. **Option C: Manual deployment on EC2 (you SSH into EC2 yourself):**

   ```bash
   # Upload project to EC2
   scp -i ~/.ssh/your-key.pem -r . ubuntu@YOUR_EC2_IP:~/document-converter/

   # SSH into EC2
   ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_EC2_IP

   # Navigate to project and deploy
   cd ~/document-converter
   ./deploy-local.sh
   ```

#### Manual Docker Deployment

1. **Build and run locally:**

   ```bash
   docker-compose up -d --build
   ```

2. **Access the application:**
   - Frontend: `http://localhost`
   - Backend API: `http://localhost:8000`
   - API Documentation: `http://localhost:8000/docs`

#### Manual Docker Installation

If you need to install Docker manually on any Ubuntu system:

```bash
# Make the script executable
chmod +x install-docker.sh

# Run the installation
./install-docker.sh
```

#### Production URLs (after EC2 deployment)

- Frontend: `http://YOUR_EC2_IP`
- Backend API: `http://YOUR_EC2_IP:8000`
- API Documentation: `http://YOUR_EC2_IP:8000/docs`

## Configuration

### Environment Variables

Create a `.env` file for custom configuration:

```env
# Production settings
ENVIRONMENT=production
HOST=0.0.0.0
PORT=8000
RELOAD=false
```

### Docker Configuration

The application uses Docker Compose with:

- **Application Container**: Runs both frontend (Next.js) and backend (FastAPI)
- **Nginx Container**: Reverse proxy and load balancer
- **Persistent Storage**: Upload files are stored in Docker volumes

### SSL/HTTPS Setup (Optional)

For production with custom domain:

1. Obtain SSL certificates (Let's Encrypt recommended)
2. Place certificates in `./ssl/` directory
3. Uncomment HTTPS server block in `nginx.conf`
4. Update domain name in nginx configuration

## Docker Management

### Available Scripts

- **`install-docker.sh`** - Installs Docker and Docker Compose on Ubuntu
- **`setup-ec2-docker.sh`** - Prepares EC2 instance with Docker and security configuration
- **`deploy-docker-ec2.sh`** - Complete remote deployment script (includes Docker installation)
- **`deploy-local.sh`** - Local deployment script (run directly on EC2 after uploading project)

### Common Commands

```bash
# Build and start services
docker-compose up -d --build

# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f document-converter
docker-compose logs -f nginx

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Update application
git pull
docker-compose down
docker-compose up -d --build

# Clean up unused Docker resources
docker system prune -f
```

### Monitoring

```bash
# View resource usage
docker stats

# Check disk usage
docker system df

# View container health
docker-compose ps
```

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
