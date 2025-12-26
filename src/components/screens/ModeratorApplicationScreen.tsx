'use client';

import React, { useState } from 'react';
import { Screen } from '@/types';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
    navigate: (screen: Screen) => void;
    goBack: () => void;
    userId?: string; // Current user's ID
}

const ModeratorApplicationScreen: React.FC<Props> = ({ navigate, goBack, userId }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!userId) {
            setError('You must be logged in to apply');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // TODO: Call Convex mutation when integrated
            // const result = await applyForModerator({ userId });

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            setIsSubmitted(true);
        } catch (err: any) {
            setError(err.message || 'Failed to submit application');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
                <header className="flex items-center p-4 border-b border-black/5 dark:border-transparent">
                    <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="flex-1 text-center text-lg font-bold text-stone-900 dark:text-white pr-8">
                        Application Submitted
                    </h1>
                </header>

                <main className="flex-1 flex flex-col items-center justify-center p-6">
                    <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6">
                        <CheckCircle className="w-12 h-12 text-success" />
                    </div>

                    <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-3 text-center">
                        Application Received!
                    </h2>

                    <p className="text-stone-600 dark:text-text-muted text-center max-w-md mb-8">
                        Thank you for your interest in becoming a moderator. Your application is pending review by our admin team.
                        We'll notify you once a decision has been made.
                    </p>

                    <button
                        onClick={() => navigate(Screen.SETTINGS)}
                        className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
                    >
                        Back to Settings
                    </button>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
            <header className="flex items-center p-4 border-b border-black/5 dark:border-transparent">
                <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="flex-1 text-center text-lg font-bold text-stone-900 dark:text-white pr-8">
                    Become a Moderator
                </h1>
            </header>

            <main className="flex-1 p-6 space-y-6 pb-24">
                {/* Hero Section */}
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <Shield className="w-10 h-10 text-primary" />
                    </div>

                    <h2 className="text-2xl font-bold text-stone-900 dark:text-white">
                        Help Keep Samiati Safe
                    </h2>

                    <p className="text-stone-600 dark:text-text-muted max-w-md mx-auto">
                        Moderators play a vital role in maintaining our community's cultural integrity and ensuring
                        respectful dialogue across all languages and traditions.
                    </p>
                </div>

                {/* Responsibilities */}
                <div className="bg-white dark:bg-[#32241a] rounded-xl p-6 space-y-4">
                    <h3 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">task_alt</span>
                        Moderator Responsibilities
                    </h3>

                    <ul className="space-y-3">
                        {[
                            'Review and action user reports promptly',
                            'Enforce community guidelines fairly and consistently',
                            'Protect cultural content from misinformation',
                            'Support users in resolving conflicts',
                            'Maintain confidentiality of moderation decisions'
                        ].map((item, index) => (
                            <li key={index} className="flex items-start gap-3 text-stone-700 dark:text-text-muted">
                                <span className="material-symbols-outlined text-success text-xl mt-0.5">check_circle</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Requirements */}
                <div className="bg-white dark:bg-[#32241a] rounded-xl p-6 space-y-4">
                    <h3 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">verified_user</span>
                        What We Look For
                    </h3>

                    <ul className="space-y-3">
                        {[
                            'Active participation in the Samiati community',
                            'Respect for diverse cultures and languages',
                            'Fair and unbiased judgment',
                            'Commitment to regular availability',
                            'Strong communication skills'
                        ].map((item, index) => (
                            <li key={index} className="flex items-start gap-3 text-stone-700 dark:text-text-muted">
                                <span className="material-symbols-outlined text-primary text-xl mt-0.5">star</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Benefits */}
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 space-y-4">
                    <h3 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">workspace_premium</span>
                        Moderator Benefits
                    </h3>

                    <ul className="space-y-3">
                        {[
                            'Exclusive moderator badge on your profile',
                            'Early access to new features',
                            'Direct communication with the Samiati team',
                            'Recognition in the community',
                            'Contribute to cultural preservation'
                        ].map((item, index) => (
                            <li key={index} className="flex items-start gap-3 text-stone-700 dark:text-text-muted">
                                <span className="material-symbols-outlined text-warning text-xl mt-0.5">emoji_events</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-error/10 border border-error/20 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                        <p className="text-error text-sm">{error}</p>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                            Submitting...
                        </>
                    ) : (
                        <>
                            <Shield className="w-5 h-5" />
                            Apply to Become a Moderator
                        </>
                    )}
                </button>

                {/* Disclaimer */}
                <p className="text-xs text-stone-500 dark:text-text-muted/60 text-center">
                    By applying, you agree to uphold Samiati's community guidelines and moderation policies.
                    Applications are reviewed by our admin team and approval is not guaranteed.
                </p>
            </main>
        </div>
    );
};

export default ModeratorApplicationScreen;
