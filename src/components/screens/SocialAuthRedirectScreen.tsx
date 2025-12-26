import React, { useEffect } from 'react';

interface Props {
  provider: 'Google' | 'Facebook';
  onComplete: () => void;
}

const SocialAuthRedirectScreen: React.FC<Props> = ({ provider, onComplete }) => {
  useEffect(() => {
    // Simulate network delay for authentication
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark items-center justify-center p-4">
      <div className="w-24 h-24 bg-white dark:bg-surface-dark rounded-full shadow-lg flex items-center justify-center mb-8 relative">
        <span className="material-symbols-outlined text-5xl text-stone-700 dark:text-sand-beige">
          {provider === 'Google' ? 'public' : 'account_circle'}
        </span>
        <div className="absolute -bottom-2 -right-2 bg-primary text-white rounded-full p-1.5 shadow-md">
           <span className="material-symbols-outlined text-xl animate-spin">sync</span>
        </div>
      </div>
      
      <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-2">
        Connecting to {provider}...
      </h2>
      <p className="text-stone-500 dark:text-text-muted text-center max-w-xs">
        Please wait while we verify your credentials securely.
      </p>
    </div>
  );
};

export default SocialAuthRedirectScreen;