import React from 'react';

interface Props {
  title: string;
  message: string;
  onPrimary: () => void;
  onSecondary?: () => void;
  icon?: string;
}

const ConfirmationScreen: React.FC<Props> = ({ title, message, onPrimary, onSecondary, icon = 'celebration' }) => {
  return (
    <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark relative">
      <button onClick={onSecondary || onPrimary} className="absolute top-4 right-4 p-2 text-stone-900 dark:text-white">
        <span className="material-symbols-outlined text-3xl">close</span>
      </button>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-8">
          <span className="material-symbols-outlined text-primary text-6xl">{icon}</span>
        </div>
        <h1 className="text-3xl font-bold text-stone-900 dark:text-white mb-3">{title}</h1>
        <p className="text-stone-600 dark:text-stone-300 max-w-md">{message}</p>
      </div>

      <div className="p-6 space-y-3 pb-8">
        <button onClick={onPrimary} className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors">
          View Details
        </button>
        {onSecondary && (
          <button onClick={onSecondary} className="w-full py-3.5 bg-transparent text-text-muted hover:text-stone-900 dark:hover:text-white font-bold rounded-xl transition-colors">
            Go Back
          </button>
        )}
      </div>
    </div>
  );
};

export default ConfirmationScreen;
