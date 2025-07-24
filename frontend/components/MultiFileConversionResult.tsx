'use client';

import { useState } from 'react';
import { Download, Copy, Eye, EyeOff, CheckCircle, XCircle, Loader2, Archive } from 'lucide-react';
import { FileConversionResult, OutputFormat } from '@/types';
import { downloadContent, getFileExtension, getMimeType } from '@/lib/api';

interface MultiFileConversionResultProps {
  results: FileConversionResult[];
  outputFormat: OutputFormat;
}

export default function MultiFileConversionResult({ results, outputFormat }: MultiFileConversionResultProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set());
  const [copiedFiles, setCopiedFiles] = useState<Set<number>>(new Set());

  const completedResults = results.filter(r => r.result && r.result.success);
  const failedResults = results.filter(r => r.result && !r.result.success);
  const processingResults = results.filter(r => r.isConverting);

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFiles(newExpanded);
  };

  const handleCopy = async (index: number, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      const newCopied = new Set(copiedFiles);
      newCopied.add(index);
      setCopiedFiles(newCopied);
      setTimeout(() => {
        setCopiedFiles(prev => {
          const updated = new Set(prev);
          updated.delete(index);
          return updated;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleDownload = (filename: string, content: string) => {
    const extension = getFileExtension(outputFormat);
    const mimeType = getMimeType(outputFormat);
    const downloadFilename = filename.replace(/\.[^/.]+$/, '') + '.' + extension;
    downloadContent(content, downloadFilename, mimeType);
  };

  const handleDownloadAll = () => {
    completedResults.forEach((result, index) => {
      if (result.result?.content) {
        setTimeout(() => {
          handleDownload(result.file.name, result.result!.content!);
        }, index * 100); // Stagger downloads
      }
    });
  };

  const formatContent = (content: string): string => {
    if (outputFormat === 'json') {
      try {
        return JSON.stringify(JSON.parse(content), null, 2);
      } catch {
        return content;
      }
    }
    return content;
  };

  if (results.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-700">{completedResults.length} completed</span>
            </div>
            {failedResults.length > 0 && (
              <div className="flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-700">{failedResults.length} failed</span>
              </div>
            )}
            {processingResults.length > 0 && (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                <span className="text-sm text-gray-700">{processingResults.length} processing</span>
              </div>
            )}
          </div>
          {completedResults.length > 1 && (
            <button
              onClick={handleDownloadAll}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition-colors"
            >
              <Archive className="w-4 h-4" />
              <span>Download All</span>
            </button>
          )}
        </div>
      </div>

      {/* Individual Results */}
      <div className="space-y-3">
        {results.map((result, index) => (
          <div key={`${result.file.name}-${index}`} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {result.isConverting ? (
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  ) : result.result?.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm text-gray-900 truncate">{result.file.name}</span>
                  {result.isConverting && (
                    <span className="text-xs text-gray-500">Converting...</span>
                  )}
                </div>
                
                {result.result?.success && result.result.content && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => toggleExpanded(index)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
                      title={expandedFiles.has(index) ? 'Hide Preview' : 'Show Preview'}
                    >
                      {expandedFiles.has(index) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleCopy(index, result.result!.content!)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
                      title="Copy"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(result.file.name, result.result!.content!)}
                      className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition-colors"
                    >
                      Download
                    </button>
                  </div>
                )}
              </div>
              
              {copiedFiles.has(index) && (
                <div className="mt-2">
                  <span className="text-xs text-gray-600">Copied to clipboard</span>
                </div>
              )}
            </div>

            {/* Preview */}
            {expandedFiles.has(index) && result.result?.success && result.result.content && (
              <div className="p-4">
                <div className="bg-gray-50 rounded border overflow-hidden">
                  <div className="max-h-60 overflow-auto">
                    <pre className="p-4 text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {formatContent(result.result.content)}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {result.result && !result.result.success && (
              <div className="p-4">
                <span className="text-sm text-red-600">Conversion failed</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
