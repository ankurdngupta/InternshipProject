import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { AIResponse, ActionType } from '../types';
import { Copy, Check, BookOpen, Clock, Loader2, ArrowRight } from 'lucide-react';

interface EditorialReaderProps {
  summaryResponse: AIResponse | null;
  explanationResponse: AIResponse | null;
  activeView: ActionType | null;
  onSelectView: (view: ActionType) => void;
  isLoading: boolean;
  loadingAction: ActionType | null;
  hasDocument: boolean;
  documentTitle: string | null;
  onRequestGenerate: (action: ActionType) => void;
}

export const EditorialReader: React.FC<EditorialReaderProps> = ({
  summaryResponse,
  explanationResponse,
  activeView,
  onSelectView,
  isLoading,
  loadingAction,
  hasDocument,
  documentTitle,
  onRequestGenerate,
}) => {
  const [copied, setCopied] = useState(false);

  // Active response based on current tab
  const activeResponse = activeView === 'summary' ? summaryResponse : explanationResponse;

  const handleCopy = async () => {
    if (!activeResponse) return;
    try {
      await navigator.clipboard.writeText(activeResponse.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback if clipboard API is restricted
      const textArea = document.createElement('textarea');
      textArea.value = activeResponse.content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const calculateReadTime = (content: string) => {
    const words = content.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
  };

  return (
    <div className="bg-paper-100 border border-paper-200 rounded-sm shadow-subtle min-h-[540px] flex flex-col">
      {/* Editorial Reader Header / Tab bar */}
      <div className="border-b border-paper-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 bg-paper-100/90">
        {/* View Switchers if at least one generated */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => onSelectView('summary')}
            disabled={!summaryResponse && isLoading && loadingAction !== 'summary'}
            className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors flex items-center space-x-1.5 ${
              activeView === 'summary'
                ? 'bg-ink-900 text-paper-50 shadow-subtle'
                : summaryResponse
                ? 'bg-paper-200/80 text-ink-800 hover:bg-paper-300'
                : 'text-ink-400 hover:text-ink-700'
            }`}
          >
            <span>Summary</span>
            {summaryResponse && <span className="w-1.5 h-1.5 rounded-full bg-rust-500"></span>}
          </button>

          <button
            type="button"
            onClick={() => onSelectView('explanation')}
            disabled={!explanationResponse && isLoading && loadingAction !== 'explanation'}
            className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors flex items-center space-x-1.5 ${
              activeView === 'explanation'
                ? 'bg-ink-900 text-paper-50 shadow-subtle'
                : explanationResponse
                ? 'bg-paper-200/80 text-ink-800 hover:bg-paper-300'
                : 'text-ink-400 hover:text-ink-700'
            }`}
          >
            <span>Simple Explanation</span>
            {explanationResponse && <span className="w-1.5 h-1.5 rounded-full bg-olive-700"></span>}
          </button>
        </div>

        {/* Right side controls: Metadata & Copy */}
        {activeResponse && !isLoading && (
          <div className="flex items-center space-x-3 text-xs">
            <div className="hidden sm:flex items-center space-x-2 text-ink-500 font-mono text-[11px]">
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-ink-400" />
                <span>{calculateReadTime(activeResponse.content)}</span>
              </span>
              <span>•</span>
              <span>{activeResponse.model}</span>
              {activeResponse.chunks_processed > 1 && (
                <>
                  <span>•</span>
                  <span>{activeResponse.chunks_processed} chunks</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-sm border transition-all text-xs font-medium ${
                copied
                  ? 'bg-olive-50 border-olive-200 text-olive-800'
                  : 'bg-paper-50 border-paper-300 text-ink-800 hover:bg-paper-200 hover:border-ink-400'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-olive-700" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-ink-600" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main Reading Canvas */}
      <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
        {/* State A: Loading in progress */}
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-sm bg-paper-200 border border-paper-300 flex items-center justify-center mb-4 text-rust-600">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>

            <h3 className="font-serif text-xl font-semibold text-ink-900 tracking-tight">
              {loadingAction === 'summary'
                ? 'Synthesizing Academic Summary...'
                : 'Drafting Beginner-Friendly Explanation...'}
            </h3>

            <p className="text-xs sm:text-sm text-ink-600 mt-2 leading-relaxed">
              Analyzing text structure, extracting core concepts, and structuring clean editorial markdown...
            </p>

            <div className="mt-6 flex items-center space-x-2 text-xs font-mono text-ink-500 bg-paper-50 px-3 py-1.5 rounded border border-paper-200">
              <span className="w-2 h-2 rounded-full bg-rust-600 animate-pulse" />
              <span>Grounded in source document</span>
            </div>
          </div>
        ) : activeResponse ? (
          /* State B: Rendered Editorial Content */
          <article className="prose prose-stone max-w-3xl mx-auto">
            {/* Header info */}
            <div className="border-b border-paper-200 pb-4 mb-6">
              <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-rust-600 mb-1">
                <span>
                  {activeResponse.action === 'summary' ? 'Academic Study Summary' : 'Plain-Language Conceptual Guide'}
                </span>
                <span>•</span>
                <span className="text-ink-500">{activeResponse.source_word_count.toLocaleString()} source words</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight !mt-0 !mb-1">
                {activeResponse.title}
              </h2>
            </div>

            {/* Markdown rendered with editorial styling */}
            <div className="editorial-content font-sans text-ink-800 leading-relaxed text-sm sm:text-base space-y-4">
              <ReactMarkdown
                components={{
                  h2: ({ node, ...props }) => (
                    <h2
                      className="font-serif text-xl sm:text-2xl font-bold text-ink-900 tracking-tight border-b border-paper-200 pb-2 mt-8 mb-3 first:mt-2"
                      {...props}
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3
                      className="font-serif text-lg font-semibold text-ink-800 tracking-tight mt-5 mb-2"
                      {...props}
                    />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="leading-relaxed my-3 text-ink-800 text-[15px]" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc pl-5 my-3 space-y-2 text-ink-800" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal pl-5 my-3 space-y-2 text-ink-800" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="leading-relaxed pl-1" {...props} />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong className="font-semibold text-ink-900 bg-paper-200/60 px-1 py-0.5 rounded-xs" {...props} />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      className="border-l-2 border-rust-600 pl-4 py-1 italic my-4 text-ink-700 bg-rust-50/40 rounded-r-sm"
                      {...props}
                    />
                  ),
                  code: ({ node, ...props }) => (
                    <code
                      className="font-mono text-xs bg-paper-200 text-ink-900 px-1.5 py-0.5 rounded border border-paper-300"
                      {...props}
                    />
                  ),
                }}
              >
                {activeResponse.content}
              </ReactMarkdown>
            </div>
          </article>
        ) : hasDocument ? (
          /* State C: Document is loaded, but user hasn't generated either action yet */
          <div className="h-full flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-sm bg-paper-200 border border-paper-300 flex items-center justify-center mb-4 text-ink-700">
              <BookOpen className="w-6 h-6" />
            </div>

            <h3 className="font-serif text-xl font-semibold text-ink-900 tracking-tight">
              Ready to analyze {documentTitle || 'your document'}
            </h3>

            <p className="text-xs sm:text-sm text-ink-600 mt-2 leading-relaxed">
              Choose one of the two editorial tools above to transform your source text into an academic study summary or an intuitive plain-language explanation.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => onRequestGenerate('summary')}
                className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 text-xs font-medium rounded-sm bg-ink-900 text-paper-50 hover:bg-ink-800 shadow-subtle transition-colors"
              >
                <span>Generate Summary</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onRequestGenerate('explanation')}
                className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 text-xs font-medium rounded-sm bg-paper-50 border border-paper-300 text-ink-900 hover:bg-paper-200 transition-colors"
              >
                <span>Explain Simply</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* State D: Empty workspace desk before document selection */
          <div className="h-full flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-sm bg-paper-200/80 border border-paper-300 flex items-center justify-center mb-4 text-ink-400">
              <BookOpen className="w-7 h-7" />
            </div>

            <h3 className="font-serif text-xl font-semibold text-ink-900 tracking-tight">
              Your reading desk is empty.
            </h3>

            <p className="text-xs sm:text-sm text-ink-600 mt-2 leading-relaxed">
              Upload a course PDF, text file, or paste your reading notes on the left. MARGIN will read the text and produce a structured study summary or beginner explanation.
            </p>

            <div className="mt-6 p-4 rounded-sm bg-paper-50 border border-paper-200 text-left w-full space-y-2 text-xs text-ink-700">
              <div className="flex items-start space-x-2">
                <span className="font-mono text-rust-600 font-bold">1.</span>
                <span>Selectable text is extracted safely via PyMuPDF.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-mono text-rust-600 font-bold">2.</span>
                <span>Generate structured academic outlines with key definitions.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-mono text-rust-600 font-bold">3.</span>
                <span>Break down dense jargon into beginner-friendly analogies.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
