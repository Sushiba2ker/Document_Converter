import { ConversionResponse, HealthResponse, SupportedFormats, OutputFormat } from '@/types';

export interface AsyncJobResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  filename: string;
  result?: ConversionResponse;
}

export interface ServerStats {
  active_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  total_jobs: number;
  max_workers: number;
  queue_size: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function checkHealth(): Promise<HealthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new ApiError(response.status, 'Health check failed');
    }
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, 'Failed to connect to server');
  }
}

export async function getSupportedFormats(): Promise<SupportedFormats> {
  try {
    const response = await fetch(`${API_BASE_URL}/formats`);
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to get supported formats');
    }
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, 'Failed to connect to server');
  }
}

export async function convertDocument(
  file: File,
  outputFormat: OutputFormat,
  includeImages: boolean = true,
  includeTables: boolean = true,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal
): Promise<ConversionResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('output_format', outputFormat);
    formData.append('include_images', includeImages.toString());
    formData.append('include_tables', includeTables.toString());

    const response = await fetch(`${API_BASE_URL}/convert`, {
      method: 'POST',
      body: formData,
      signal: signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new ApiError(response.status, errorData.detail || 'Conversion failed');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, 'Failed to convert document');
  }
}

export async function startAsyncConversion(
  file: File,
  outputFormat: OutputFormat,
  includeImages: boolean = true,
  includeTables: boolean = true,
  signal?: AbortSignal
): Promise<AsyncJobResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('output_format', outputFormat);
    formData.append('include_images', includeImages.toString());
    formData.append('include_tables', includeTables.toString());

    const response = await fetch(`${API_BASE_URL}/convert-async`, {
      method: 'POST',
      body: formData,
      signal: signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new ApiError(response.status, errorData.detail || 'Failed to start conversion');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, 'Failed to start async conversion');
  }
}

export async function getJobStatus(jobId: string, signal?: AbortSignal): Promise<JobStatusResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/convert-status/${jobId}`, {
      signal: signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new ApiError(response.status, errorData.detail || 'Failed to get job status');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, 'Failed to get job status');
  }
}

export async function getServerStats(): Promise<ServerStats> {
  try {
    const response = await fetch(`${API_BASE_URL}/server-stats`);

    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to get server stats');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, 'Failed to get server stats');
  }
}

export async function convertMultipleDocumentsAsync(
  files: File[],
  outputFormat: OutputFormat,
  includeImages: boolean = true,
  includeTables: boolean = true,
  onProgress?: (fileIndex: number, progress: number) => void,
  onFileComplete?: (fileIndex: number, result: ConversionResponse) => void,
  signal?: AbortSignal
): Promise<void> {
  const jobIds: string[] = [];

  // Start all conversions
  for (let i = 0; i < files.length; i++) {
    if (signal?.aborted) {
      throw new Error('Operation cancelled');
    }

    try {
      const jobResponse = await startAsyncConversion(
        files[i],
        outputFormat,
        includeImages,
        includeTables,
        signal
      );
      jobIds.push(jobResponse.job_id);
      onProgress?.(i, 10); // Started
    } catch (error) {
      if (signal?.aborted) {
        throw new Error('Operation cancelled');
      }
      onFileComplete?.(i, {
        success: false,
        message: 'Failed to start conversion',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Poll for results
  const pollInterval = 1000; // 1 second
  const maxPollTime = 300000; // 5 minutes
  const startTime = Date.now();

  while (jobIds.length > 0 && (Date.now() - startTime) < maxPollTime) {
    if (signal?.aborted) {
      throw new Error('Operation cancelled');
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));

    for (let i = jobIds.length - 1; i >= 0; i--) {
      if (signal?.aborted) {
        throw new Error('Operation cancelled');
      }

      const jobId = jobIds[i];
      const fileIndex = files.findIndex((_, idx) =>
        jobIds.indexOf(jobId) === idx
      );

      try {
        const status = await getJobStatus(jobId, signal);
        onProgress?.(fileIndex, status.progress);

        if (status.status === 'completed' || status.status === 'failed') {
          if (status.result) {
            onFileComplete?.(fileIndex, status.result);
          }
          jobIds.splice(i, 1); // Remove completed job
        }
      } catch (error) {
        if (signal?.aborted) {
          throw new Error('Operation cancelled');
        }
        // Job might be expired or not found
        onFileComplete?.(fileIndex, {
          success: false,
          message: 'Job status check failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        jobIds.splice(i, 1);
      }
    }
  }

  // Handle any remaining jobs that timed out
  for (const jobId of jobIds) {
    const fileIndex = files.findIndex((_, idx) =>
      jobIds.indexOf(jobId) === idx
    );
    onFileComplete?.(fileIndex, {
      success: false,
      message: 'Conversion timed out',
      error: 'The conversion took too long to complete'
    });
  }
}

export function downloadContent(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getFileExtension(outputFormat: OutputFormat): string {
  const extensions: Record<OutputFormat, string> = {
    markdown: 'md',
    html: 'html',
    json: 'json',
    text: 'txt',
    doctags: 'xml'
  };
  return extensions[outputFormat] || 'txt';
}

export function getMimeType(outputFormat: OutputFormat): string {
  const mimeTypes: Record<OutputFormat, string> = {
    markdown: 'text/markdown',
    html: 'text/html',
    json: 'application/json',
    text: 'text/plain',
    doctags: 'application/xml'
  };
  return mimeTypes[outputFormat] || 'text/plain';
}

export function downloadMultipleFiles(
  files: { filename: string; content: string }[],
  outputFormat: OutputFormat
) {
  files.forEach((file, index) => {
    setTimeout(() => {
      const extension = getFileExtension(outputFormat);
      const mimeType = getMimeType(outputFormat);
      const filename = file.filename.replace(/\.[^/.]+$/, '') + '.' + extension;
      downloadContent(file.content, filename, mimeType);
    }, index * 200); // Stagger downloads to avoid browser blocking
  });
}
