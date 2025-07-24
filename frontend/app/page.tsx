'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import FormatSelector from '@/components/FormatSelector';
import MultiFileConversionResult from '@/components/MultiFileConversionResult';
import { OutputFormat, FileConversionResult } from '@/types';
import { convertMultipleDocumentsAsync } from '@/lib/api';

export default function HomePage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('markdown');
  const [includeImages, setIncludeImages] = useState(true);
  const [includeTables, setIncludeTables] = useState(true);
  const [fileResults, setFileResults] = useState<FileConversionResult[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState<string>('');
  const [conversionController, setConversionController] = useState<AbortController | null>(null);

  const handleFilesSelect = (files: File[]) => {
    // Filter out duplicate files based on name and size
    const existingFileKeys = selectedFiles.map(f => `${f.name}-${f.size}`);
    const uniqueNewFiles = files.filter(f =>
      !existingFileKeys.includes(`${f.name}-${f.size}`)
    );

    const duplicateCount = files.length - uniqueNewFiles.length;

    if (duplicateCount > 0) {
      setDuplicateMessage(`${duplicateCount} duplicate file(s) skipped`);
      setTimeout(() => setDuplicateMessage(''), 3000);
    }

    if (uniqueNewFiles.length > 0) {
      const newFiles = [...selectedFiles, ...uniqueNewFiles];
      setSelectedFiles(newFiles);
      setFileResults([]);
    }
  };

  const handleFileRemove = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setFileResults([]);
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
    setFileResults([]);
  };



  const handleConvert = async () => {
    if (selectedFiles.length === 0) return;

    setIsConverting(true);

    // Create abort controller for cancellation
    const controller = new AbortController();
    setConversionController(controller);

    // Initialize results with all files
    const initialResults: FileConversionResult[] = selectedFiles.map(file => ({
      file,
      isConverting: true
    }));
    setFileResults(initialResults);

    try {
      // Use async conversion for better concurrent handling
      await convertMultipleDocumentsAsync(
        selectedFiles,
        outputFormat,
        includeImages,
        includeTables,
        // Progress callback
        (fileIndex: number, progress: number) => {
          if (controller.signal.aborted) return;
          setFileResults(prev => prev.map((result, index) =>
            index === fileIndex
              ? { ...result, isConverting: progress < 100 }
              : result
          ));
        },
        // File complete callback
        (fileIndex: number, result) => {
          if (controller.signal.aborted) return;
          setFileResults(prev => prev.map((fileResult, index) =>
            index === fileIndex
              ? { ...fileResult, result, isConverting: false }
              : fileResult
          ));
        },
        // Pass abort signal
        controller.signal
      );
    } catch (error) {
      if (controller.signal.aborted) {
        // Handle cancellation
        setFileResults(prev => prev.map(result => ({
          ...result,
          isConverting: false,
          result: result.result || {
            success: false,
            message: 'Conversion cancelled',
            error: 'Operation was cancelled by user'
          }
        })));
      }
    }

    setIsConverting(false);
    setConversionController(null);
  };

  const handleCancel = () => {
    if (conversionController) {
      conversionController.abort();
      setConversionController(null);
      setIsConverting(false);
    }
  };

  const canConvert = selectedFiles.length > 0 && !isConverting;

  return (
    <div className="space-y-12">
      <div className="text-center">
        <p className="text-gray-600">
          Convert documents to various formats
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
          <FileUpload
            onFilesSelect={handleFilesSelect}
            selectedFiles={selectedFiles}
            onFileRemove={handleFileRemove}
            onClearAll={handleClearAll}
            disabled={isConverting}
          />

          {duplicateMessage && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">{duplicateMessage}</p>
            </div>
          )}
        </div>

        {selectedFiles.length > 0 && (
          <FormatSelector
            selectedFormat={outputFormat}
            onFormatChange={setOutputFormat}
            includeImages={includeImages}
            onIncludeImagesChange={setIncludeImages}
            includeTables={includeTables}
            onIncludeTablesChange={setIncludeTables}
            disabled={isConverting}
          />
        )}

        {selectedFiles.length > 0 && (
          <div className="flex justify-center space-x-3">
            {!isConverting ? (
              <button
                onClick={handleConvert}
                disabled={!canConvert}
                className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Convert {selectedFiles.length} file(s)
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Cancel
                </button>
                <div className="flex items-center px-4 py-3 text-gray-600">
                  Converting {selectedFiles.length} file(s)...
                </div>
              </>
            )}
          </div>
        )}

        {fileResults.length > 0 && (
          <MultiFileConversionResult
            results={fileResults}
            outputFormat={outputFormat}
          />
        )}
      </div>

    </div>
  );
}
