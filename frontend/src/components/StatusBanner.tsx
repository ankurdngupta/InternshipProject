import React from 'react';
import { AlertCircle, X, Key, RefreshCw } from 'lucide-react';

interface StatusBannerProps {
  error: string | null;
  instructions?: string | null;
  onDismiss: () => void;
  onOpenConfig?: () => void;
  onRetry?: () => void;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  error,
  instructions,
  onDismiss,
  onOpenConfig,
  onRetry,
}) => {
  if (!error) return null;

  const isConfigError =
    error.includes('GEMINI_API_KEY') ||
    error.includes('OPENAI_API_KEY') ||
    error.toLowerCase().includes('configuration') ||
    error.toLowerCase().includes('api key');
  const isScannedPdfError = error.toLowerCase().includes('scanned') || error.toLowerCase().includes('ocr');

  return (
    <div className={`mb-6 p-4 rounded-sm border transition-all text-xs flex items-start justify-between gap-3 ${
      isConfigError
        ? 'bg-rust-50 border-rust-200 text-rust-900'
        : isScannedPdfError
        ? 'bg-amber-50 border-amber-200 text-amber-900'
        : 'bg-rust-50 border-rust-200 text-rust-900'
    }`}>
      <div className="flex items-start space-x-3">
        <div className="shrink-0 mt-0.5">
          {isConfigError ? (
            <Key className="w-4 h-4 text-rust-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rust-600" />
          )}
        </div>

        <div className="space-y-1">
          <p className="font-medium font-sans leading-relaxed">
            {error}
          </p>

          {instructions && (
            <p className="text-[11px] text-ink-600 font-mono mt-1">
              {instructions}
            </p>
          )}

          <div className="flex items-center space-x-3 pt-1">
            {isConfigError && onOpenConfig && (
              <button
                type="button"
                onClick={onOpenConfig}
                className="font-medium text-rust-700 underline hover:text-rust-900 flex items-center space-x-1"
              >
                <span>Open API Configuration Instructions</span>
              </button>
            )}

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="font-medium text-ink-700 hover:text-ink-900 flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="text-ink-400 hover:text-ink-800 shrink-0 p-0.5"
        title="Dismiss notice"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
