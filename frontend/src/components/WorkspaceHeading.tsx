import React from 'react';

export const WorkspaceHeading: React.FC = () => {
  return (
    <div className="mb-8 pt-2">
      <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-rust-600 mb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-rust-600"></span>
        <span>Study Workspace</span>
      </div>
      <h1 className="font-serif text-3xl sm:text-4xl text-ink-900 tracking-tight font-medium">
        Make sense of what you’re studying.
      </h1>
      <p className="mt-2 text-sm sm:text-base text-ink-700 max-w-2xl font-sans leading-relaxed">
        Upload textbook excerpts, lecture slides, or paste rough reading notes. Transform dense materials into clear academic summaries and intuitive, step-by-step explanations.
      </p>
    </div>
  );
};
