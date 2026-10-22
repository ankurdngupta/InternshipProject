import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { WorkspaceHeading } from './components/WorkspaceHeading';
import { DocumentInput } from './components/DocumentInput';
import { DocumentCard } from './components/DocumentCard';
import { ActionPanel } from './components/ActionPanel';
import { EditorialReader } from './components/EditorialReader';
import { StatusBanner } from './components/StatusBanner';
import { ConfigModal } from './components/ConfigModal';
import { ExtractedDocument, AIResponse, ActionType, HealthInfo } from './types';
import { fetchHealth, generateSummary, generateExplanation, AppError } from './api';

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [currentDocument, setCurrentDocument] = useState<ExtractedDocument | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingAction, setLoadingAction] = useState<ActionType | null>(null);

  // Cached generated responses for the current document
  const [summaryResponse, setSummaryResponse] = useState<AIResponse | null>(null);
  const [explanationResponse, setExplanationResponse] = useState<AIResponse | null>(null);
  const [activeView, setActiveView] = useState<ActionType | null>(null);

  // Global error banner
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorInstructions, setErrorInstructions] = useState<string | null>(null);

  // Config modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Load health information on initial mount
  const checkBackendHealth = async () => {
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch {
      // Backend may be starting up
    }
  };

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDocumentLoaded = (doc: ExtractedDocument) => {
    setCurrentDocument(doc);
    setErrorMessage(null);
    setErrorInstructions(null);
    // Reset responses for new document
    setSummaryResponse(null);
    setExplanationResponse(null);
    setActiveView(null);
  };

  const handleReplaceDocument = () => {
    setCurrentDocument(null);
    setErrorMessage(null);
    setErrorInstructions(null);
  };

  const handleRemoveDocument = () => {
    setCurrentDocument(null);
    setSummaryResponse(null);
    setExplanationResponse(null);
    setActiveView(null);
    setErrorMessage(null);
    setErrorInstructions(null);
  };

  const handleGenerate = async (action: ActionType) => {
    if (!currentDocument) return;

    // If already generated for this document and not currently generating, simply switch view
    if (action === 'summary' && summaryResponse) {
      setActiveView('summary');
      return;
    }
    if (action === 'explanation' && explanationResponse) {
      setActiveView('explanation');
      return;
    }

    setIsGenerating(true);
    setLoadingAction(action);
    setErrorMessage(null);
    setErrorInstructions(null);
    setActiveView(action);

    try {
      if (action === 'summary') {
        const response = await generateSummary(currentDocument.text, currentDocument.filename);
        setSummaryResponse(response);
      } else {
        const response = await generateExplanation(currentDocument.text, currentDocument.filename);
        setExplanationResponse(response);
      }
    } catch (err) {
      if (err instanceof AppError) {
        setErrorMessage(err.detail);
        setErrorInstructions(err.instructions || null);
      } else {
        setErrorMessage((err as Error).message || 'Failed to generate content.');
      }
    } finally {
      setIsGenerating(false);
      setLoadingAction(null);
    }
  };

  const handleSelectView = (view: ActionType) => {
    setActiveView(view);
    // If the requested view has not been generated yet, automatically run generation
    if (currentDocument) {
      if (view === 'summary' && !summaryResponse && !isGenerating) {
        handleGenerate('summary');
      } else if (view === 'explanation' && !explanationResponse && !isGenerating) {
        handleGenerate('explanation');
      }
    }
  };

  return (
    <div className="min-h-screen bg-paper-50 flex flex-col font-sans selection:bg-rust-100 selection:text-rust-700">
      {/* Top Header */}
      <Header
        health={health}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <WorkspaceHeading />

        {/* Status / Error Banner */}
        <StatusBanner
          error={errorMessage}
          instructions={errorInstructions}
          onDismiss={() => {
            setErrorMessage(null);
            setErrorInstructions(null);
          }}
          onOpenConfig={() => setIsConfigModalOpen(true)}
          onRetry={loadingAction ? () => handleGenerate(loadingAction) : undefined}
        />

        {/* Reading Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Panel: Document Input & Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {!currentDocument ? (
              <DocumentInput
                onDocumentLoaded={handleDocumentLoaded}
                isProcessing={isExtracting}
                setIsProcessing={setIsExtracting}
                onError={(err, instructions) => {
                  setErrorMessage(err);
                  setErrorInstructions(instructions || null);
                }}
              />
            ) : (
              <div>
                <DocumentCard
                  document={currentDocument}
                  onReplace={handleReplaceDocument}
                  onRemove={handleRemoveDocument}
                />

                <ActionPanel
                  onSelectAction={handleGenerate}
                  activeAction={activeView}
                  isLoading={isGenerating}
                  loadingAction={loadingAction}
                  disabled={!currentDocument}
                />
              </div>
            )}
          </div>

          {/* Right Panel: Editorial Reading Canvas (7 cols) */}
          <div className="lg:col-span-7">
            <EditorialReader
              summaryResponse={summaryResponse}
              explanationResponse={explanationResponse}
              activeView={activeView}
              onSelectView={handleSelectView}
              isLoading={isGenerating}
              loadingAction={loadingAction}
              hasDocument={Boolean(currentDocument)}
              documentTitle={currentDocument?.filename || null}
              onRequestGenerate={handleGenerate}
            />
          </div>
        </div>
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-paper-200 bg-paper-100 py-6 mt-12 text-xs text-ink-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-serif font-bold text-ink-900">MARGIN</span>
            <span>—</span>
            <span>Digital Reading Studio for Students</span>
          </div>

          <div className="flex items-center space-x-4 font-mono text-[11px] text-ink-400">
            <span>PyMuPDF Text Engine</span>
            <span>•</span>
            <span>Local Extractor</span>
            <span>•</span>
            <span>Grounded AI Tutor</span>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        health={health}
        onRefreshHealth={checkBackendHealth}
      />
    </div>
  );
};
