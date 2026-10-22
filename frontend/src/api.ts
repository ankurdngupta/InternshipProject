import { ExtractedDocument, AIResponse, HealthInfo, ApiError } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export class AppError extends Error {
  detail: string;
  errorType?: string;
  instructions?: string;
  statusCode?: number;

  constructor(detail: string, errorType?: string, instructions?: string, statusCode?: number) {
    super(detail);
    this.name = 'AppError';
    this.detail = detail;
    this.errorType = errorType;
    this.instructions = instructions;
    this.statusCode = statusCode;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ApiError = { detail: 'An unexpected server error occurred.' };
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: response.statusText || `Request failed with status ${response.status}` };
    }
    throw new AppError(
      errorData.detail || 'An unexpected error occurred.',
      errorData.error_type,
      errorData.instructions,
      response.status
    );
  }
  return response.json();
}

export async function fetchHealth(): Promise<HealthInfo> {
  const response = await fetch(`${API_BASE}/health`);
  return handleResponse<HealthInfo>(response);
}

export async function extractFile(file: File): Promise<ExtractedDocument> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/extract`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse<ExtractedDocument>(response);
}

export async function extractText(text: string, title?: string): Promise<ExtractedDocument> {
  const response = await fetch(`${API_BASE}/extract-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, title }),
  });

  return handleResponse<ExtractedDocument>(response);
}

export async function generateSummary(text: string, title?: string): Promise<AIResponse> {
  const response = await fetch(`${API_BASE}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, title }),
  });

  return handleResponse<AIResponse>(response);
}

export async function generateExplanation(text: string, title?: string): Promise<AIResponse> {
  const response = await fetch(`${API_BASE}/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, title }),
  });

  return handleResponse<AIResponse>(response);
}
