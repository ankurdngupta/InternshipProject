export type FileType = 'pdf' | 'txt' | 'pasted';

export interface ExtractedDocument {
  filename: string;
  file_type: FileType;
  text: string;
  char_count: number;
  word_count: number;
  page_count: number | null;
  preview: string;
}

export type ActionType = 'summary' | 'explanation';

export interface AIResponse {
  action: ActionType;
  title: string;
  content: string;
  model: string;
  chunks_processed: number;
  source_word_count: number;
}

export interface HealthInfo {
  status: string;
  service: string;
  gemini_configured?: boolean;
  gemini_model?: string;
  openai_configured?: boolean;
  openai_model?: string;
  max_file_size_mb: number;
}

export interface ApiError {
  detail: string;
  error_type?: string;
  instructions?: string;
}
