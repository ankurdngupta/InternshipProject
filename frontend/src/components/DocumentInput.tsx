import React, { useState, useRef, DragEvent } from 'react';
import { UploadCloud, FileText, Clipboard, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { extractFile, extractText, AppError } from '../api';
import { ExtractedDocument } from '../types';
import { SAMPLE_DOCUMENTS, SampleDoc } from '../sampleData';

interface DocumentInputProps {
  onDocumentLoaded: (doc: ExtractedDocument) => void;
  isProcessing: boolean;
  setIsProcessing: (loading: boolean) => void;
  onError: (error: string, instructions?: string) => void;
}

export const DocumentInput: React.FC<DocumentInputProps> = ({
  onDocumentLoaded,
  isProcessing,
  setIsProcessing,
  onError,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [isDragOver, setIsDragOver] = useState(false);
  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedContent, setPastedContent] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const validateAndProcessFile = async (file: File) => {
    setLocalError(null);
    const filename = file.name.toLowerCase();

    if (!filename.endsWith('.pdf') && !filename.endsWith('.txt')) {
      const msg = `Unsupported file type "${file.name}". Please upload a PDF (.pdf) or plain text (.txt) file.`;
      setLocalError(msg);
      onError(msg);
      return;
    }

    if (file.size === 0) {
      const msg = `The selected file "${file.name}" is empty (0 bytes).`;
      setLocalError(msg);
      onError(msg);
      return;
    }

    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      const msg = `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 15 MB limit.`;
      setLocalError(msg);
      onError(msg);
      return;
    }

    setIsProcessing(true);
    try {
      const extracted = await extractFile(file);
      onDocumentLoaded(extracted);
    } catch (err) {
      if (err instanceof AppError) {
        setLocalError(err.detail);
        onError(err.detail, err.instructions);
      } else {
        const msg = (err as Error).message || 'Failed to extract text from document.';
        setLocalError(msg);
        onError(msg);
      }
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await validateAndProcessFile(file);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await validateAndProcessFile(file);
    }
  };

  const handlePastedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const trimmed = pastedContent.trim();
    if (!trimmed) {
      const msg = 'Please enter or paste your study notes before continuing.';
      setLocalError(msg);
      onError(msg);
      return;
    }

    if (trimmed.length < 15) {
      const msg = 'Pasted notes are too short. Please provide at least 15 characters of study material.';
      setLocalError(msg);
      onError(msg);
      return;
    }

    setIsProcessing(true);
    try {
      const title = pastedTitle.trim() || 'Study Notes';
      const extracted = await extractText(trimmed, title);
      onDocumentLoaded(extracted);
      setPastedContent('');
      setPastedTitle('');
    } catch (err) {
      if (err instanceof AppError) {
        setLocalError(err.detail);
        onError(err.detail, err.instructions);
      } else {
        const msg = (err as Error).message || 'Failed to process pasted notes.';
        setLocalError(msg);
        onError(msg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = async (sample: SampleDoc) => {
    setLocalError(null);
    setIsProcessing(true);
    try {
      const extracted = await extractText(sample.text, sample.title);
      onDocumentLoaded(extracted);
    } catch (err) {
      const msg = (err as Error).message || 'Failed to load sample document.';
      setLocalError(msg);
      onError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-paper-100 border border-paper-200 rounded-sm p-5 shadow-subtle">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center space-x-1 border-b border-paper-200 pb-3 mb-4">
        <button
          type="button"
          onClick={() => {
            setActiveTab('upload');
            setLocalError(null);
          }}
          className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
            activeTab === 'upload'
              ? 'bg-ink-900 text-paper-50 shadow-subtle'
              : 'text-ink-700 hover:text-ink-900 hover:bg-paper-200'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload Document</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('paste');
            setLocalError(null);
          }}
          className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
            activeTab === 'paste'
              ? 'bg-ink-900 text-paper-50 shadow-subtle'
              : 'text-ink-700 hover:text-ink-900 hover:bg-paper-200'
          }`}
        >
          <Clipboard className="w-3.5 h-3.5" />
          <span>Paste Notes</span>
        </button>
      </div>

      {/* Tab 1: Upload Document */}
      {activeTab === 'upload' && (
        <div>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-rust-600 bg-rust-50/50'
                : 'border-paper-300 hover:border-ink-400 bg-paper-50/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".pdf,.txt,application/pdf,text/plain"
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-paper-200 text-ink-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>

              <div>
                <p className="text-sm font-medium text-ink-900">
                  <span className="text-rust-600 underline underline-offset-2">Click to browse</span> or drag and drop your document
                </p>
                <p className="text-xs text-ink-500 mt-1">
                  Supports PDF (.pdf) and plain text (.txt) up to 15 MB
                </p>
              </div>

              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-paper-200 text-[11px] text-ink-700 font-mono">
                <span>PyMuPDF Text Engine</span>
                <span className="text-ink-400">•</span>
                <span>Selectable text only</span>
              </div>
            </div>
          </div>

          {/* Quick sample loader presets */}
          <div className="mt-4 pt-4 border-t border-paper-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-ink-700 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rust-600" />
                <span>Quick Test Material</span>
              </span>
              <span className="text-[11px] text-ink-400">1-click test</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SAMPLE_DOCUMENTS.map((sample) => (
                <button
                  key={sample.category}
                  type="button"
                  onClick={() => handleLoadSample(sample)}
                  disabled={isProcessing}
                  className="text-left p-2 rounded-sm bg-paper-50 border border-paper-200 hover:border-paper-400 hover:bg-paper-100/80 transition-all text-xs group"
                >
                  <span className="font-mono text-[10px] text-rust-600 uppercase block tracking-wider">
                    {sample.category}
                  </span>
                  <span className="text-ink-800 font-medium block truncate mt-0.5 group-hover:text-ink-900">
                    {sample.title.replace('.txt', '')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Paste Notes */}
      {activeTab === 'paste' && (
        <form onSubmit={handlePastedSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">
              Document Label / Subject <span className="text-ink-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={pastedTitle}
              onChange={(e) => setPastedTitle(e.target.value)}
              placeholder="e.g. Bio 101 — Lecture 3 Notes"
              className="w-full text-xs px-3 py-2 bg-paper-50 border border-paper-300 rounded-sm focus:outline-none focus:border-rust-600 text-ink-900 placeholder:text-ink-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-ink-700">
                Study Notes or Excerpt <span className="text-rust-600">*</span>
              </label>
              <span className="text-[11px] font-mono text-ink-500">
                {pastedContent.split(/\s+/).filter(Boolean).length} words • {pastedContent.length} chars
              </span>
            </div>
            <textarea
              rows={8}
              value={pastedContent}
              onChange={(e) => setPastedContent(e.target.value)}
              placeholder="Paste lecture slides, study outlines, textbook passages, or key questions here..."
              className="w-full text-xs font-mono p-3 bg-paper-50 border border-paper-300 rounded-sm focus:outline-none focus:border-rust-600 text-ink-900 placeholder:text-ink-400 leading-relaxed resize-y"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setPastedContent('');
                setPastedTitle('');
              }}
              className="px-3 py-1.5 text-xs text-ink-500 hover:text-ink-900 transition-colors"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isProcessing || !pastedContent.trim()}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-medium rounded-sm bg-ink-900 text-paper-50 hover:bg-ink-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-subtle transition-colors"
            >
              <span>Load into Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* Local Error feedback */}
      {localError && (
        <div className="mt-3 p-2.5 rounded-sm bg-rust-50 border border-rust-100 flex items-start space-x-2 text-xs text-rust-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rust-600" />
          <p className="leading-relaxed">{localError}</p>
        </div>
      )}
    </div>
  );
};
