# Document Converter - Frontend

A minimalist Next.js 15 frontend for document conversion, built with TypeScript and Tailwind CSS.

## Features

- 🚀 **Next.js 15** with App Router
- 📝 **TypeScript** for type safety
- 🎨 **Minimalist design** with clean UI
- 📁 **Drag & Drop** file upload
- 🔄 **Simple conversion** workflow
- 📱 **Responsive design**
- ⚡ **Clean and focused** interface

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

## Prerequisites

- Node.js 18+
- The Python FastAPI backend running on port 8000

## Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Backend Integration

The frontend communicates with the FastAPI backend running on `http://localhost:8000`. Make sure to start the Python backend first:

```bash
# In the project root directory
python run.py
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── FileUpload.tsx     # File upload component
│   ├── FormatSelector.tsx # Format selection
│   ├── ConversionResult.tsx # Results display
│   └── LoadingSpinner.tsx # Loading indicator
├── lib/                   # Utility functions
│   └── api.ts            # API client
├── types/                 # TypeScript types
│   └── index.ts          # Type definitions
└── public/               # Static assets
```

## Configuration

The frontend is configured to proxy API requests to the backend:

- Development: `http://localhost:8000`
- Production: `http://localhost:8000`

You can modify the API base URL in `lib/api.ts` if needed.

## Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Class Variance Authority** - Component variants

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is part of the Docling Document Converter application.
