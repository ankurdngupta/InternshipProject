import React from 'react';
import { X, Key, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { HealthInfo } from '../types';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: HealthInfo | null;
  onRefreshHealth: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  health,
  onRefreshHealth,
}) => {
  if (!isOpen) return null;

  const isConfigured = Boolean(health?.gemini_configured ?? health?.openai_configured);
  const activeModel = health?.gemini_model || health?.openai_model || 'gemini-2.5-flash';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-xs">
      <div className="bg-paper-50 border border-paper-300 rounded-sm shadow-sheet max-w-lg w-full p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-400 hover:text-ink-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 rounded-sm bg-rust-50 border border-rust-100 text-rust-600 flex items-center justify-center">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-ink-900">
              Google Gemini API Configuration
            </h3>
            <p className="text-xs text-ink-500">
              Official Google Gen AI Python SDK integration for MARGIN
            </p>
          </div>
        </div>

        {/* Current Status Box */}
        <div className={`p-3 rounded-sm border mb-4 text-xs ${
          isConfigured
            ? 'bg-olive-50 border-olive-200 text-olive-900'
            : 'bg-rust-50 border-rust-200 text-rust-900'
        }`}>
          <div className="flex items-center space-x-2 font-medium">
            {isConfigured ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-olive-700 shrink-0" />
                <span>Google Gemini API Key is active and ready.</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-rust-600 shrink-0" />
                <span>GEMINI_API_KEY is not yet configured.</span>
              </>
            )}
          </div>
          <div className="mt-1.5 font-mono text-[11px] text-ink-700">
            Model: <span className="font-semibold text-ink-900">{activeModel}</span>{' '}
            <span className="text-ink-500">(free tier supported)</span>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="space-y-3 text-xs text-ink-700 font-sans leading-relaxed">
          <p className="font-medium text-ink-900">How to configure your Gemini API Key:</p>

          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Get your API key free from{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-rust-600 underline font-medium inline-flex items-center space-x-0.5"
              >
                <span>Google AI Studio</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>.
            </li>
            <li>
              Create or edit <code className="bg-paper-200 px-1 py-0.5 rounded font-mono text-[11px]">backend/.env</code> in this workspace with:
              <pre className="bg-paper-200 p-2.5 rounded-sm font-mono text-[11px] text-ink-900 my-1.5 overflow-x-auto">
GEMINI_API_KEY=your_actual_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
              </pre>
            </li>
            <li>
              <span className="font-medium">Free Tier Note:</span> <code className="bg-paper-200 px-1 rounded font-mono">gemini-2.5-flash</code> is available on Google AI Studio's free tier (15 requests/min, 1,500 requests/day). You can also configure <code className="bg-paper-200 px-1 rounded font-mono">gemini-1.5-flash</code>.
            </li>
            <li>
              Save <code className="bg-paper-200 px-1 py-0.5 rounded font-mono text-[11px]">backend/.env</code>. The backend server automatically reloads.
            </li>
          </ol>
        </div>

        <div className="mt-6 pt-4 border-t border-paper-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onRefreshHealth}
            className="px-3 py-1.5 text-xs text-ink-700 hover:text-ink-900 hover:bg-paper-200 rounded-sm border border-paper-300 transition-colors"
          >
            Check Status Again
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-sm bg-ink-900 text-paper-50 hover:bg-ink-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
