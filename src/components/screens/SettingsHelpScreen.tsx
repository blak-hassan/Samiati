"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAction } from "convex/react";
import { api } from '../../../convex/_generated/api';
import { Message } from '@/types';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";

interface Props {
    goBack: () => void;
}

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-muted/20 rounded-xl mb-3 border border-border/50 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-all duration-200 text-left group"
            >
                <span className="font-semibold text-foreground pr-4">{question}</span>
                <span className={`material-symbols-outlined text-muted-foreground transition-all duration-300 ${isOpen ? 'rotate-180 text-primary' : 'group-hover:text-foreground'}`}>expand_more</span>
            </button>
            <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <div className="p-5 pt-0 text-sm text-muted-foreground leading-relaxed">
                        {answer}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SettingsHelpScreen: React.FC<Props> = ({ goBack }) => {
    const sendMessageAction = useAction(api.sunflower.sendMessage);
    const [query, setQuery] = useState('');
    const [conversation, setConversation] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isResetting, setIsResetting] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (conversation.length > 0 || isLoading) {
            scrollToBottom();
        }
    }, [conversation, isLoading]);

    const handleReset = () => {
        setIsResetting(true);
        setConversation([]);
        setQuery('');
        setTimeout(() => setIsResetting(false), 300);
    };

    const handleAsk = async () => {
        if (!query.trim()) return;

        const userText = query;
        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: userText,
            timestamp: new Date()
        };

        const currentHistory = [...conversation];

        setConversation(prev => [...prev, userMsg]);
        setQuery('');
        setIsLoading(true);

        try {
            const responseText = await sendMessageAction({
                userMessage: userText,
                conversationHistory: currentHistory.map(msg => ({
                    sender: msg.sender,
                    text: msg.text,
                })),
            });

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
        <div className="flex flex-col h-full bg-background transition-colors duration-300">
            <SettingsPageHeader title="Help & Support" onBack={goBack}>
                {conversation.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        disabled={isResetting || isLoading}
                        className="text-xs text-muted-foreground hover:text-foreground"
                    >
                        <RefreshCw className={`w-4 h-4 mr-1 ${isResetting ? 'animate-spin' : ''}`} />
                        Reset
                    </Button>
                )}
            </SettingsPageHeader>

            {/* Top Input Bar */}
            <div className="flex-none p-4 bg-muted/20 border-b border-border/50">
                <div className="max-w-2xl mx-auto">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-primary">auto_awesome</span>
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleAsk()}
                            placeholder={conversation.length === 0 ? "Ask about Samiati..." : "Type your message..."}
                            disabled={isLoading}
                            className="w-full bg-background border border-border/50 rounded-2xl py-4 pl-12 pr-14 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-70 text-base"
                        />
                        <button
                            onClick={handleAsk}
                            disabled={!query.trim() || isLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none shadow-md hover:shadow-lg"
                        >
                            <span className="material-symbols-outlined text-base">arrow_upward</span>
                        </button>
                        {isLoading && (
                            <div className="absolute -bottom-6 left-0 text-[10px] text-muted-foreground font-medium">
                                Samiati is typing...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto px-5 py-6 scroll-smooth">

                {/* FAQ Section - Always visible */}
                <div className="max-w-2xl mx-auto space-y-0 mb-8">
                    <div>
                        <div className="space-y-0">
                            <FAQItem question="What can I do with Samiati?" answer="You can ask questions, get help, and have conversations in your own language." />
                            <FAQItem question="Can I speak instead of typing?" answer="Yes. You can talk to Samiati and get responses by voice or text." />
                            <FAQItem question="Which languages can I use?" answer="Select your language from the dropdown on the chat. Help us add more." />
                            <FAQItem question="Can Samiati understand and reply in my local language?" answer="Yes. Samiati is built to understand and respond in your preferred local language." />
                            <FAQItem question="Do I need internet to use Samiati?" answer="Some features need internet, but offline support will be added." />
                            <FAQItem question="Is Samiati free to use?" answer="We offer a limited number of free messages. More usage may require a plan." />
                            <FAQItem question="Why is Samiati sometimes not accurate?" answer="Some languages have limited data, but accuracy improves over time, you can help us with that." />
                            <FAQItem question="Can I help improve my language on Samiati?" answer="Yes. You can Changa, and help grow your language." />
                            <FAQItem question="Who is Samiati for?" answer="Anyone who wants to experience technology naturally, in their own language." />
                        </div>
                    </div>
                </div>

                {/* Chat History Section */}
                {conversation.length > 0 && (
                    <div className="max-w-2xl mx-auto space-y-4">
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
                                            : 'bg-muted/20 border border-border/50 rounded-bl-none text-foreground'
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
                                    <div className="bg-muted/20 border border-border/50 p-4 rounded-2xl rounded-bl-none shadow-sm">
                                        <div className="flex gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-typing-dot"></span>
                                            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-typing-dot" style={{ animationDelay: '0.2s' }}></span>
                                            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-typing-dot" style={{ animationDelay: '0.4s' }}></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                )}

            </main>


        </div>
    );
};

export default SettingsHelpScreen;


