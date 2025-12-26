import React, { useState } from 'react';
import { Screen } from '@/types';

interface Props {
  screen: Screen;
  navigate: (screen: Screen) => void;
}

const ResetPasswordFlow: React.FC<Props> = ({ screen, navigate }) => {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 1. Forgot Password Input
  if (screen === Screen.FORGOT_PASSWORD) {
    return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
        <header className="flex items-center p-4 border-b border-black/5 dark:border-white/5">
          <button onClick={() => navigate(Screen.SIGN_IN)} className="p-2 -ml-2 text-stone-900 dark:text-white"><span className="material-symbols-outlined">arrow_back</span></button>
          <h2 className="flex-1 text-center text-lg font-bold text-stone-900 dark:text-white pr-8">Reset Your Password</h2>
        </header>
        <main className="flex-1 flex flex-col items-center p-4 pt-8">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-6">
            <span className="material-symbols-outlined text-5xl">key</span>
          </div>
          <p className="text-center text-stone-600 dark:text-stone-300 mb-8 max-w-sm">Enter your registered email below to receive password reset instructions.</p>
          
          <div className="w-full max-w-md mb-auto">
            <label className="block font-medium text-stone-900 dark:text-white mb-2">Email Address</label>
            <input type="email" placeholder="Enter your email" className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-4 text-stone-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
          </div>

          <div className="w-full max-w-md space-y-4 mb-4">
            <button onClick={() => navigate(Screen.RESET_LINK_SENT)} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-primary/20">
              Send Reset Link
            </button>
            <button onClick={() => navigate(Screen.SIGN_IN)} className="w-full text-primary font-medium hover:underline">
              Back to Sign In
            </button>
          </div>
        </main>
      </div>
    );
  }

  // 2. Link Sent Confirmation
  if (screen === Screen.RESET_LINK_SENT) {
    return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark items-center justify-center p-4">
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-8">
          <span className="material-symbols-outlined text-5xl">mark_email_read</span>
        </div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">Link Sent!</h1>
        <p className="text-center text-stone-600 dark:text-stone-400 max-w-xs mb-8">We've sent a password reset link to your email address. Please check your inbox and spam folder.</p>
        
        <div className="w-full max-w-xs space-y-4">
          <button onClick={() => navigate(Screen.SET_NEW_PASSWORD)} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-colors">
            Return to Sign In
          </button>
          <p className="text-center text-sm text-stone-600 dark:text-stone-400">
            Didn't receive it? <button className="text-primary font-bold hover:underline">Resend Link</button>
          </p>
        </div>
        {/* Simulating clicking the link from email goes to Set New Password */}
      </div>
    );
  }

  // 3. Set New Password
  if (screen === Screen.SET_NEW_PASSWORD) {
    return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
        <header className="flex items-center p-4">
          <button onClick={() => navigate(Screen.SIGN_IN)} className="p-2 -ml-2 text-stone-500 dark:text-stone-400"><span className="material-symbols-outlined">arrow_back</span></button>
          <h2 className="flex-1 text-center text-lg font-bold text-stone-900 dark:text-white pr-8">Set New Password</h2>
        </header>
        <main className="flex-1 p-4 pt-6">
          <p className="text-center text-stone-600 dark:text-stone-300 mb-8">Create a new, strong password for your account.</p>
          
          <div className="space-y-6 max-w-md mx-auto">
            <div>
              <label className="block font-medium text-stone-900 dark:text-white mb-2">New Password</label>
              <div className="relative">
                <input 
                    type={showNewPassword ? "text" : "password"} 
                    placeholder="Enter your new password" 
                    className="w-full bg-stone-100 dark:bg-[#332619] border border-stone-300 dark:border-[#674d32] rounded-xl p-4 pr-12 text-stone-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                />
                <button 
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-4 text-stone-500 dark:text-text-muted hover:text-stone-800 dark:hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">{showNewPassword ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
              
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-center text-sm font-medium text-warning">
                  <span>Medium</span>
                </div>
                <div className="h-2 w-full bg-stone-200 dark:bg-[#674d32] rounded-full overflow-hidden">
                  <div className="h-full bg-warning w-[66%] rounded-full"></div>
                </div>
                <p className="text-xs text-stone-500 dark:text-text-muted">Password must be at least 8 characters.</p>
              </div>
            </div>

            <div>
              <label className="block font-medium text-stone-900 dark:text-white mb-2">Confirm New Password</label>
              <div className="relative">
                <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Confirm your new password" 
                    className="w-full bg-stone-100 dark:bg-[#332619] border border-stone-300 dark:border-[#674d32] rounded-xl p-4 pr-12 text-stone-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                />
                <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-4 text-stone-500 dark:text-text-muted hover:text-stone-800 dark:hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-8 max-w-md mx-auto space-y-4">
            <button onClick={() => navigate(Screen.PASSWORD_CHANGED)} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl transition-colors">
              Set New Password
            </button>
            <button onClick={() => navigate(Screen.SIGN_IN)} className="w-full bg-transparent text-primary font-bold py-4 rounded-xl hover:bg-primary/5 transition-colors">
              Cancel
            </button>
          </div>
        </main>
      </div>
    );
  }

  // 4. Success
  if (screen === Screen.PASSWORD_CHANGED) {
    return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark items-center justify-center p-6 text-center">
        <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-8">
          <span className="material-symbols-outlined text-7xl">task_alt</span>
        </div>
        <h1 className="text-3xl font-bold text-stone-900 dark:text-white mb-2">Password Changed!</h1>
        <p className="text-stone-600 dark:text-stone-400 max-w-xs mb-12">You can now sign in with your new password.</p>
        <button onClick={() => navigate(Screen.SIGN_IN)} className="w-full max-w-md bg-primary hover:bg-primary-hover text-background-dark font-bold py-4 rounded-xl transition-colors">
          Return to Sign In
        </button>
      </div>
    );
  }

  return null;
};

export default ResetPasswordFlow;
