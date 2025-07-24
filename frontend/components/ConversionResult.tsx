'use client';

import { useState } from 'react';
import { Download, Copy, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { ConversionResponse, OutputFormat } from '@/types';
import { downloadContent, getFileExtension, getMimeType } from '@/lib/api';

interface ConversionResultProps {
  result: ConversionResponse;
  outputFormat: OutputFormat;
  originalFilename: string;
}

export default function ConversionResult({ result, outputFormat, originalFilename }: ConversionResultProps) {
  const [showPreview, setShowPreview] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    if (!result.content) return;
    
    const extension = getFileExtension(outputFormat);
    const mimeType = getMimeType(outputFormat);
    const filename = originalFilename.replace(/\.[^/.]+$/, '') + '.' + extension;
    
    downloadContent(result.content, filename, mimeType);
  };

  const handleCopy = async () => {
    if (!result.content) return;
    
    try {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const formatContent = (content: string, format: OutputFormat): string => {
    if (format === 'json') {
      try {
        return JSON.stringify(JSON.parse(content), null, 2);
      } catch {
        return content;
      }
    }
    return content;
  };

  const getLanguageForHighlighting = (format: OutputFormat): string => {
    const languageMap: Record<OutputFormat, string> = {
      markdown: 'markdown',
      html: 'html',
      json: 'json',
      text: 'text',
      doctags: 'xml'
    };
    return languageMap[format] || 'text';
  };

  if (!result.success) {
    return (
      <div className="border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700">Conversion failed</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-700">Conversion complete</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
              title={showPreview ? 'Hide Preview' : 'Show Preview'}
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={handleCopy}
              className="p-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
              title="Copy"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition-colors"
            >
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Copy Success Message */}
      {copied && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
          <p className="text-sm text-gray-600">Copied to clipboard</p>
        </div>
      )}

      {/* Content Preview */}
      {showPreview && result.content && (
        <div className="p-4">
          <div className="bg-gray-50 rounded border overflow-hidden">
            <div className="max-h-80 overflow-auto">
              <pre className="p-4 text-sm text-gray-700 whitespace-pre-wrap break-words">
                {formatContent(result.content, outputFormat)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
