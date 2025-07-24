'use client';

import { useCallback, useState } from 'react';
import { Upload, File, X, Plus } from 'lucide-react';

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  selectedFiles: File[];
  onFileRemove: (index: number) => void;
  onClearAll: () => void;
  disabled?: boolean;
}

const SUPPORTED_EXTENSIONS = [
  '.pdf', '.docx', '.pptx', '.xlsx', '.html', '.htm', '.md', '.markdown',
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.csv', '.xml'
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function FileUpload({ onFilesSelect, selectedFiles, onFileRemove, onClearAll, disabled }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string>('');

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 50MB';
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      return `Unsupported file type. Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`;
    }

    return null;
  }, []);

  const handleFilesSelect = useCallback((files: File[]) => {
    const validFiles: File[] = [];
    let hasError = false;

    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        hasError = true;
        break;
      }
      validFiles.push(file);
    }

    if (!hasError) {
      setError('');
      onFilesSelect(validFiles);
    }
  }, [validateFile, onFilesSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFilesSelect(files);
    }
  }, [disabled, handleFilesSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFilesSelect(Array.from(files));
      // Reset input value to allow selecting same files again
      e.target.value = '';
    }
  }, [handleFilesSelect]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (selectedFiles.length > 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{selectedFiles.length} file(s) selected</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => !disabled && document.getElementById('file-input')?.click()}
              disabled={disabled}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 border border-gray-200 px-3 py-1 rounded hover:border-gray-300"
            >
              <Plus className="w-3 h-3" />
              <span>Add More</span>
            </button>
            <button
              onClick={onClearAll}
              disabled={disabled}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              Clear all
            </button>
          </div>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {selectedFiles.map((file, index) => (
            <div key={`${file.name}-${index}`} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <File className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900 truncate">{file.name}</span>
                </div>
                <button
                  onClick={() => onFileRemove(index)}
                  disabled={disabled}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {/* Hidden file input - always present */}
        <input
          id="file-input"
          type="file"
          multiple
          className="hidden"
          accept={SUPPORTED_EXTENSIONS.join(',')}
          onChange={handleInputChange}
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver ? 'border-gray-400 bg-gray-50' : 'border-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-300'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('file-input')?.click()}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-1">Drop files here or click to browse</p>
        <p className="text-sm text-gray-400">PDF, DOCX, PPTX, XLSX, HTML, MD, Images, CSV, XML</p>
        <input
          id="file-input"
          type="file"
          multiple
          className="hidden"
          accept={SUPPORTED_EXTENSIONS.join(',')}
          onChange={handleInputChange}
          disabled={disabled}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
