import React, { useState } from 'react';
import { ExtractedDocument } from '../types';
import { FileText, Trash2, RefreshCw, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

interface DocumentCardProps {
  document: ExtractedDocument;
  onReplace: () => void;
  onRemove: () => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onReplace,
  onRemove,
}) => {
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

  const getBadgeColor = () => {
    switch (document.file_type) {
      case 'pdf':
        return 'bg-rust-50 text-rust-700 border-rust-100';
      case 'txt':
        return 'bg-olive-50 text-olive-800 border-olive-100';
      case 'pasted':
        return 'bg-paper-200 text-ink-800 border-paper-300';
    }
  };

  return (
    <div className="bg-paper-100 border border-paper-200 rounded-sm p-4 shadow-subtle mb-6">
      {/* Top Bar: Title & Actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3 overflow-hidden">
          <div className="w-9 h-9 rounded-sm bg-paper-200 border border-paper-300 text-ink-800 flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="w-5 h-5 text-ink-700" />
          </div>

          <div className="overflow-hidden">
            <div className="flex items-center space-x-2">
              <h3 className="font-serif text-base font-semibold text-ink-900 truncate tracking-tight">
                {document.filename}
              </h3>
              <span className={`text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border ${getBadgeColor()}`}>
                {document.file_type}
              </span>
            </div>

            {/* Document stats */}
            <div className="flex items-center space-x-3 text-xs text-ink-500 font-mono mt-1">
              {document.page_count !== null && (
                <>
                  <span>{document.page_count} {document.page_count === 1 ? 'page' : 'pages'}</span>
                  <span className="text-paper-300">•</span>
                </>
              )}
              <span>{document.word_count.toLocaleString()} words</span>
              <span className="text-paper-300">•</span>
              <span>{document.char_count.toLocaleString()} characters</span>
            </div>
          </div>
        </div>

        {/* Action buttons: Replace & Remove */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            type="button"
            onClick={onReplace}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs text-ink-700 hover:text-ink-900 hover:bg-paper-200 rounded-sm border border-paper-300 transition-colors"
            title="Replace with another document"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">Replace</span>
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-rust-600 hover:text-rust-700 hover:bg-rust-50 rounded-sm border border-transparent hover:border-rust-100 transition-colors"
            title="Remove document from workspace"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Remove</span>
          </button>
        </div>
      </div>

      {/* Extracted Text Preview Section */}
      <div className="mt-3 pt-3 border-t border-paper-200">
        <div className="flex items-center justify-between text-xs text-ink-500 mb-1.5">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-600 flex items-center space-x-1">
            <BookOpen className="w-3 h-3 text-ink-500" />
            <span>Extracted Source Text Preview</span>
          </span>
          <button
            type="button"
            onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
            className="text-xs text-rust-600 hover:text-rust-700 flex items-center space-x-1 font-medium"
          >
            <span>{isPreviewExpanded ? 'Collapse' : 'Expand full text'}</span>
            {isPreviewExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        <div className={`bg-paper-50 border border-paper-200 rounded-sm p-3 font-mono text-[11px] text-ink-700 leading-relaxed overflow-y-auto transition-all ${
          isPreviewExpanded ? 'max-h-72' : 'max-h-24'
        }`}>
          {isPreviewExpanded ? document.text : document.preview}
        </div>
      </div>
    </div>
  );
};
