import React from 'react';
import { ActionType } from '../types';
import { FileText, Lightbulb, Loader2 } from 'lucide-react';

interface ActionPanelProps {
  onSelectAction: (action: ActionType) => void;
  activeAction: ActionType | null;
  isLoading: boolean;
  loadingAction: ActionType | null;
  disabled: boolean;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  onSelectAction,
  activeAction,
  isLoading,
  loadingAction,
  disabled,
}) => {
  return (
    <div className="mb-6">
      <div className="text-[11px] font-mono uppercase tracking-wider text-ink-500 mb-2 flex items-center justify-between">
        <span>Workspace Analysis Actions</span>
        {disabled && (
          <span className="text-rust-600 font-sans">Upload or paste notes first</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Action 1: Generate Summary */}
        <button
          type="button"
          disabled={disabled || isLoading}
          onClick={() => onSelectAction('summary')}
          className={`text-left p-4 rounded-sm border transition-all relative overflow-hidden group ${
            activeAction === 'summary'
              ? 'bg-ink-900 border-ink-900 text-paper-50 shadow-sheet'
              : 'bg-paper-100 border-paper-300 text-ink-900 hover:border-ink-800 hover:bg-paper-200/70'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-7 h-7 rounded-sm flex items-center justify-center ${
                activeAction === 'summary'
                  ? 'bg-paper-50/10 text-paper-50'
                  : 'bg-paper-200 text-ink-700 group-hover:bg-paper-300'
              }`}>
                {isLoading && loadingAction === 'summary' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-rust-500" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
              </div>
              <span className="font-serif text-base font-semibold tracking-tight">
                Generate Summary
              </span>
            </div>

            <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
              activeAction === 'summary'
                ? 'bg-paper-50/20 text-paper-100'
                : 'bg-paper-200 text-ink-600'
            }`}>
              Academic
            </span>
          </div>

          <p className={`text-xs mt-2.5 leading-relaxed font-sans ${
            activeAction === 'summary' ? 'text-paper-200/90' : 'text-ink-600'
          }`}>
            Distills the core thesis, main arguments, key terminology, and high-yield takeaways into a clean structured outline.
          </p>

          {isLoading && loadingAction === 'summary' && (
            <div className="mt-3 flex items-center space-x-2 text-[11px] font-mono text-rust-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rust-500 animate-ping" />
              <span>Analyzing source material...</span>
            </div>
          )}
        </button>

        {/* Action 2: Explain Simply */}
        <button
          type="button"
          disabled={disabled || isLoading}
          onClick={() => onSelectAction('explanation')}
          className={`text-left p-4 rounded-sm border transition-all relative overflow-hidden group ${
            activeAction === 'explanation'
              ? 'bg-ink-900 border-ink-900 text-paper-50 shadow-sheet'
              : 'bg-paper-100 border-paper-300 text-ink-900 hover:border-ink-800 hover:bg-paper-200/70'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-7 h-7 rounded-sm flex items-center justify-center ${
                activeAction === 'explanation'
                  ? 'bg-paper-50/10 text-paper-50'
                  : 'bg-paper-200 text-ink-700 group-hover:bg-paper-300'
              }`}>
                {isLoading && loadingAction === 'explanation' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-rust-500" />
                ) : (
                  <Lightbulb className="w-4 h-4" />
                )}
              </div>
              <span className="font-serif text-base font-semibold tracking-tight">
                Explain Simply
              </span>
            </div>

            <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
              activeAction === 'explanation'
                ? 'bg-paper-50/20 text-paper-100'
                : 'bg-paper-200 text-ink-600'
            }`}>
              Intuitive
            </span>
          </div>

          <p className={`text-xs mt-2.5 leading-relaxed font-sans ${
            activeAction === 'explanation' ? 'text-paper-200/90' : 'text-ink-600'
          }`}>
            Translates dense jargon into plain English, breaks down multi-step logic, and uses intuitive analogies without losing rigor.
          </p>

          {isLoading && loadingAction === 'explanation' && (
            <div className="mt-3 flex items-center space-x-2 text-[11px] font-mono text-rust-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rust-500 animate-ping" />
              <span>Demystifying concepts...</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
