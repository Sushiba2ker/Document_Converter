'use client';

import { OutputFormat } from '@/types';

interface FormatSelectorProps {
  selectedFormat: OutputFormat;
  onFormatChange: (format: OutputFormat) => void;
  includeImages: boolean;
  onIncludeImagesChange: (include: boolean) => void;
  includeTables: boolean;
  onIncludeTablesChange: (include: boolean) => void;
  disabled?: boolean;
}

const OUTPUT_FORMATS: { value: OutputFormat; label: string }[] = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'html', label: 'HTML' },
  { value: 'json', label: 'JSON' },
  { value: 'text', label: 'Text' },
  { value: 'doctags', label: 'DocTags' }
];

export default function FormatSelector({
  selectedFormat,
  onFormatChange,
  includeImages,
  onIncludeImagesChange,
  includeTables,
  onIncludeTablesChange,
  disabled
}: FormatSelectorProps) {
  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Output Format</label>
        <div className="grid grid-cols-5 gap-2">
          {OUTPUT_FORMATS.map((format) => (
            <button
              key={format.value}
              onClick={() => onFormatChange(format.value)}
              disabled={disabled}
              className={`px-3 py-2 text-sm rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedFormat === format.value
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              {format.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={includeImages}
            onChange={(e) => onIncludeImagesChange(e.target.checked)}
            disabled={disabled}
            className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-500 disabled:opacity-50"
          />
          <span className="text-sm text-gray-700">Include images</span>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={includeTables}
            onChange={(e) => onIncludeTablesChange(e.target.checked)}
            disabled={disabled}
            className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-500 disabled:opacity-50"
          />
          <span className="text-sm text-gray-700">Include tables</span>
        </label>
      </div>
    </div>
  );
}
