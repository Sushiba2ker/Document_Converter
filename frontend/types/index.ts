export interface ConversionResponse {
  success: boolean;
  message: string;
  content?: string;
  metadata?: {
    filename: string;
    size: number;
    content_type: string;
    [key: string]: any;
  };
  error?: string;
}

export interface HealthResponse {
  status: string;
  message: string;
  version: string;
}

export interface SupportedFormats {
  input_formats: string[];
  output_formats: {
    value: string;
    label: string;
  }[];
}

export type OutputFormat = 'markdown' | 'html' | 'json' | 'text' | 'doctags';

export interface ConversionRequest {
  file: File;
  output_format: OutputFormat;
  include_images: boolean;
  include_tables: boolean;
}

export interface FileConversionResult {
  file: File;
  result?: ConversionResponse;
  isConverting: boolean;
  error?: string;
}

export interface ConversionState {
  isConverting: boolean;
  progress: number;
  result?: ConversionResponse;
  error?: string;
}
