import React from 'react';
import { HealthInfo } from '../types';
import { Key, CheckCircle2, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  health: HealthInfo | null;
  onOpenConfigModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ health, onOpenConfigModal }) => {
  return (
    <header className="border-b border-paper-200 bg-paper-100/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-sm bg-ink-900 text-paper-50 flex items-center justify-center font-serif text-lg font-bold shadow-subtle">
            M
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-serif text-xl font-bold tracking-tight text-ink-900">
                MARGIN
              </span>
              <span className="text-xs uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-paper-200 text-ink-700 font-mono">
                STUDIO v1.0
              </span>
            </div>
            <span className="text-xs text-ink-500 hidden sm:inline">
              Editorial workspace for student learning materials
            </span>
          </div>
        </div>

        {/* Center / Right status indicator */}
        <div className="flex items-center space-x-3 text-xs">
          {health ? (
            (health.gemini_configured ?? health.openai_configured) ? (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-sm bg-olive-50 border border-olive-100 text-olive-800 font-sans">
                <CheckCircle2 className="w-3.5 h-3.5 text-olive-700" />
                <span className="font-medium">Gemini Ready</span>
                <span className="text-olive-700/70 font-mono hidden md:inline">
                  ({health.gemini_model || health.openai_model || 'gemini-2.5-flash'})
                </span>
              </div>
            ) : (
              <button
                onClick={onOpenConfigModal}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-sm bg-rust-50 border border-rust-100 text-rust-700 hover:bg-rust-100 transition-colors"
                title="Click for instructions on setting up GEMINI_API_KEY"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rust-600" />
                <span className="font-medium">Gemini Key Needed</span>
              </button>
            )
          ) : (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-sm bg-paper-200 text-ink-500">
              <div className="w-2 h-2 rounded-full bg-ink-400 animate-pulse" />
              <span>Connecting to backend...</span>
            </div>
          )}

          <button
            onClick={onOpenConfigModal}
            className="flex items-center space-x-1 px-2 py-1 rounded-sm border border-paper-300 text-ink-700 hover:text-ink-900 hover:bg-paper-200 transition-colors"
            title="Workspace Setup & API Key Guide"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
