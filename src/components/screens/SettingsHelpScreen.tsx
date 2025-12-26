
import React, { useState, useRef, useEffect } from 'react';
import { Screen, Message } from '@/types';
import { sendMessageToGemini } from '@/services/geminiService';

interface Props {
    navigate: (screen: Screen) => void;
    goBack: () => void;
}

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-stone-100 dark:border-white/5 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors text-left"
            >
                <span className="font-medium text-stone-900 dark:text-white">{question}</span>
                <span className={`material-symbols-outlined text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            {isOpen && (
                <div className="p-4 pt-0 text-sm text-stone-600 dark:text-text-muted leading-relaxed">
                    {answer}
                </div>
            )}
        </div>
    );
};

const SettingsHelpScreen: React.FC<Props> = ({ goBack, navigate }) => {
    const [query, setQuery] = useState('');
    const [conversation, setConversation] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversation, isLoading]);

    const handleAsk = async () => {
        if (!query.trim()) return;

        const userText = query;
        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: userText,
            timestamp: new Date()
        };

        // Keep reference to current history before update for the API call
        const currentHistory = [...conversation];

        setConversation(prev => [...prev, userMsg]);
        setQuery('');
        setIsLoading(true);

        try {
            const responseText = await sendMessageToGemini(userText, currentHistory);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: responseText,
                timestamp: new Date()
            };
            setConversation(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("Failed to get help response:", error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'system',
                text: "I'm having trouble connecting right now. Please try again later.",
                timestamp: new Date()
            };
            setConversation(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-stone-50 dark:bg-background-dark transition-colors duration-300">
            <header className="flex-none flex items-center p-4 bg-stone-50 dark:bg-background-dark z-10 border-b border-stone-200 dark:border-white/5">
                <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold text-stone-900 dark:text-white ml-2">Help Center</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 scroll-smooth">

                {/* Initial Content - Only show if no conversation yet */}
                {conversation.length === 0 && (
                    <div className="space-y-6 mb-6">
                        <div>
                            <h3 className="text-xs font-bold text-stone-500 dark:text-text-muted uppercase tracking-wider mb-2 ml-2">Frequently Asked Questions</h3>
                            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-stone-200 dark:border-white/5 overflow-hidden">
                                <FAQItem question="How do I earn XP?" answer="You earn XP by contributing words, stories, verifying content, and completing daily challenges." />
                                <FAQItem question="Can I change my language?" answer="Yes, go to Settings > App Experience > Language to change your app interface language." />
                                <FAQItem question="Is Samiati free?" answer="Samiati is free to use. We offer a Samiati+ subscription for additional features like unlimited offline downloads." />
                                <FAQItem question="How do I report content?" answer="Tap the '...' menu on any post or comment and select 'Report'. Our moderation team will review it." />
                            </div>
                        </div>

                        <div className="bg-primary/10 dark:bg-primary/20 border border-primary/20 rounded-2xl p-6 flex flex-col items-center text-center space-y-4">
                            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg">
                                <span className="material-symbols-outlined text-2xl">support_agent</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-stone-900 dark:text-white">Need more help?</h3>
                                <p className="text-sm text-stone-600 dark:text-text-muted mt-1">Our support team is available 24/7 to assist you with any issues.</p>
                            </div>
                            <a
                                href="mailto:support@samiati.app?subject=Samiati%20Support%20Request"
                                className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary-hover transition-colors shadow-md w-full inline-block"
                            >
                                Contact Support
                            </a>
                        </div>
                    </div>
                )}

                {/* Chat History Section */}
                <div className="space-y-4">
                    {conversation.map((msg) => (
                        <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                            {msg.sender !== 'user' && (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 self-end mb-1">
                                    <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
                                </div>
                            )}
                            <div className={`p-3.5 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                                    ? 'bg-primary text-white rounded-br-none'
                                    : 'bg-white dark:bg-surface-dark border border-stone-200 dark:border-white/10 rounded-bl-none text-stone-800 dark:text-stone-200'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3 justify-start animate-in fade-in duration-300">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 self-end mb-1">
                                <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
                            </div>
                            <div className="bg-white dark:bg-surface-dark border border-stone-200 dark:border-white/10 p-4 rounded-2xl rounded-bl-none shadow-sm">
                                <div className="flex gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-stone-400 dark:bg-stone-500 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-stone-400 dark:bg-stone-500 rounded-full animate-bounce delay-100"></span>
                                    <span className="w-1.5 h-1.5 bg-stone-400 dark:bg-stone-500 rounded-full animate-bounce delay-200"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

            </main>

            {/* Fixed Bottom Input */}
            <div className="flex-none p-4 bg-stone-50 dark:bg-background-dark border-t border-stone-200 dark:border-white/5">
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-3.5 text-primary group-focus-within:animate-pulse">auto_awesome</span>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleAsk()}
                        placeholder={conversation.length === 0 ? "Ask Samiati for help..." : "Reply..."}
                        disabled={isLoading}
                        className="w-full bg-white dark:bg-surface-dark border border-stone-200 dark:border-white/10 rounded-xl py-3 pl-12 pr-12 text-stone-900 dark:text-white placeholder-stone-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none shadow-sm transition-all disabled:opacity-70"
                    />
                    <button
                        onClick={handleAsk}
                        disabled={!query.trim() || isLoading}
                        className="absolute right-2 top-2 p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors disabled:opacity-0 disabled:pointer-events-none"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_upward</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsHelpScreen;
