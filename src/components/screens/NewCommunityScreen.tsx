"use client";
import React, { useState } from 'react';
import { Screen, ChatPreview } from '@/types';

interface Props {
  navigate: (screen: Screen, params?: any) => void;
  goBack: () => void;
  onCreateCommunity?: (community: ChatPreview) => void;
}

const NewCommunityScreen: React.FC<Props> = ({ navigate, goBack, onCreateCommunity }) => {
  const [step, setStep] = useState<'intro' | 'form' | 'success'>('intro');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  const MOCK_SUGGESTIONS = [
    { id: '1', name: 'Kwame Mensah', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuGLE0i9NWNJMGLNeeS7Y-fkwpi4GavU-5tFQGjerfZBUK9A2baVE6a0v9b6Le6AIX-Xejh_WCf4Bb8tk8yqNXUeyVehi927mNkXbnvMb3ggvQTzfMzZcJc0kPiyaqMcPlts57mpPxJLq5-lgGwTjXzXNGyasv8_llUjyNVB2m-dLngZv8en8HyHDdbU1j_Wt2xl1HDaHg_iKgKX7HviRx7y_sXmAmU_NNuzZlrcnkbqtGL8NTvNgBOFaC4sSZ5yd97zBiTylIkog' },
    { id: '2', name: 'Zahra Ali', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHGQCh7G1VnjuVj9331GPw-eizTILg3UcwDA4ENWzw4Y4k-YeCgWzwUxAmYXQWIcfUfbQwVHw6sT-X-LP9EspDfXqNOQnm6QUcAN3d9HAxoEJ5kesDAP6W6EUQ6odygBf2Q2-wGIcEgisM6jeCizwsbd9roCE4EDfeK74dHdCooeQh3_eioZBLFJNPfGi8Cp4ke9oJ11DKdl5pNseP-GKgaT-tyieX9Uimavj73AayhR3msq3f9Dcw-BdgSJNRK5-7MQYX9T0wH_8' },
    { id: '3', name: 'Chike Okoro', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCf35EoI1LYG_Z-DVruXrhf48EMhNAfhAbaIoN6aNxIOA7VWp8i9i-bmGhJmE0dqxwKZOscNOyTdZhqM8oDoilkrWcTxcmgWw_9TKUo8f2ASQEfAbbjXAelehx2KYPAN8W1qBGBDnvXJmTlMbdPIdPtbLjIMEeo6jhXcD7OkpFeAa7ECkhmLX-DoyYLYn3mUQ7yRcrIkO3DdTcFC-tZ0hxx31yGdTsr7k-44mC1gpIEDYR6Jk63r6sc1JtxESZ_z8CzlfVQD_p38c' },
    { id: '4', name: 'Fatou Sow', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA33dgvI_8O1U2ZsGRRdIrN6msDVHDnzcOdKb2aEXmYC6BfYJvld3snbK7MQxEUsWkCLK5m9ry75kxZt9sfUj6Lj3S1keqVySoqqDOIddmUfbhh1NdpYKeiNphTGsh0op0pjtMhHziNPcUnCoOwh0BNylf0gclux6S7K-7-UHrGrvKE0tNqLQdIZ2zsi9R4Op0Mw2iKcHKarDj1ikZRS8LF2G1DNUTepgcMC76cBhfsNp4cHQ24AUuqP1KmseLie5Uq-O-YHLOwnM8' },
  ];

  const toggleMember = (id: string) => {
    const newSet = new Set(selectedMembers);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedMembers(newSet);
  };

  const handleCreate = () => {
    if (!name.trim()) return;

    if (onCreateCommunity) {
      const newCommunity: ChatPreview = {
        id: `community-${Date.now()}`,
        name: name,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTCkmqfVuPlLQ4IRyL2yV9d82xXGhUn6PZJQuyR-wOR0cvIaU2RmXVEYxrDKRF8LwvPO8ui_vLey4StEqf8CTMHBir5NqJ8BI6X6gXKzW2e5jtCmaOROPdLEoAJCmmFm51ht9zq7QwPnSBQC8TAqlJfRa5M4kLarJ9LqR6i2YIFBkKl3YmSCiPo77SFPw336bJQN6weNdBrPdUlu-Ta6wtwbzNsRkfyTwRr05-OJF-2JEsH1EwbuwH-dLxzpESsJxfK0fBRGIneoQ', // Default community icon
        lastMessage: desc || 'Welcome to the community!',
        time: 'Just now',
        unreadCount: 0,
        isOnline: false,
        isCommunity: true
      };
      onCreateCommunity(newCommunity);
    }
    setStep('success');
  };

  if (step === 'success') {
    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-background-dark animate-in fade-in">
            <main className="flex-1 p-6 flex flex-col items-center text-center justify-center">
                <div className="w-24 h-24 bg-success/20 text-success rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-5xl">check</span>
                </div>
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">Community Created!</h2>
                <p className="text-stone-600 dark:text-text-muted mb-10">"{name}" is ready for members.</p>

                <div className="w-full bg-stone-50 dark:bg-white/5 rounded-2xl p-5 text-left mb-8 shadow-sm">
                    <h3 className="font-bold text-stone-900 dark:text-white mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg text-primary">recommend</span>
                        Suggested Communities to Join
                    </h3>
                    <div className="space-y-4">
                        {[
                            { name: 'Pan-African Tech', members: '12k', icon: 'terminal' },
                            { name: 'Traditional Music', members: '8.5k', icon: 'music_note' }
                        ].map((c, i) => (
                            <div key={i} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                        <span className="material-symbols-outlined">{c.icon}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-stone-900 dark:text-white">{c.name}</p>
                                        <p className="text-xs text-stone-500 dark:text-text-muted">{c.members} members</p>
                                    </div>
                                </div>
                                <button className="px-4 py-2 rounded-full bg-stone-200 dark:bg-white/10 text-xs font-bold hover:bg-stone-300 dark:hover:bg-white/20 transition-colors text-stone-800 dark:text-white">
                                    Join
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-full mt-auto">
                    <button 
                        onClick={() => navigate(Screen.MESSAGES)}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <span>Go to {name}</span>
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                </div>
            </main>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-background-dark transition-colors duration-300">
      <header className="flex items-center p-4 bg-background-light dark:bg-surface-dark border-b border-stone-200 dark:border-white/5 sticky top-0 z-10 transition-colors">
        <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h1 className="flex-1 text-xl font-bold text-stone-900 dark:text-white ml-2">New community</h1>
      </header>

      {step === 'intro' ? (
        <main className="flex-1 flex flex-col items-center p-6 text-center space-y-8 animate-in fade-in">
            <div className="w-32 h-32 bg-stone-200 dark:bg-white/10 rounded-2xl flex items-center justify-center mb-4 mt-8">
                <span className="material-symbols-outlined text-6xl text-stone-400 dark:text-text-muted">groups</span>
            </div>

            <div className="space-y-4 max-w-sm">
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white">Create a new community</h2>
                <p className="text-stone-600 dark:text-text-muted leading-relaxed">
                    Communities bring members together in topic-based groups, and make it easy to manage and send announcements.
                </p>
            </div>

            <button 
                onClick={() => setStep('form')}
                className="w-full max-w-sm bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-full shadow-lg transition-colors flex items-center justify-center gap-2"
            >
                Get Started
            </button>
        </main>
      ) : (
        <main className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6 animate-in slide-in-from-right-2">
                <div className="flex flex-col items-center gap-4">
                    <button className="w-24 h-24 bg-stone-200 dark:bg-white/10 rounded-2xl flex items-center justify-center text-stone-400 dark:text-text-muted hover:bg-stone-300 dark:hover:bg-white/20 transition-colors relative group">
                        <span className="material-symbols-outlined text-4xl">camera_alt</span>
                        <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs text-white font-bold uppercase">Add Photo</span>
                        </div>
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-stone-900 dark:text-white mb-2">Community Name</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Community Name" 
                            className="w-full bg-stone-100 dark:bg-white/5 border-b-2 border-stone-300 dark:border-white/20 rounded-t-lg px-4 py-3 text-stone-900 dark:text-white focus:border-primary outline-none transition-colors"
                            autoFocus
                        />
                        <p className="text-right text-xs text-stone-400 mt-1">{25 - name.length}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-stone-900 dark:text-white mb-2">Description</label>
                        <textarea 
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            placeholder="What is this community about?" 
                            rows={3}
                            className="w-full bg-stone-100 dark:bg-white/5 border-b-2 border-stone-300 dark:border-white/20 rounded-t-lg px-4 py-3 text-stone-900 dark:text-white focus:border-primary outline-none transition-colors resize-none"
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <h3 className="font-bold text-stone-900 dark:text-white mb-3">Suggestions to Add</h3>
                    <div className="space-y-2">
                        {MOCK_SUGGESTIONS.map(person => (
                            <div key={person.id} className="flex items-center justify-between p-3 bg-stone-50 dark:bg-white/5 rounded-xl border border-stone-100 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <img src={person.avatar} alt={person.name} className="w-10 h-10 rounded-full object-cover" />
                                    <span className="font-medium text-stone-900 dark:text-white">{person.name}</span>
                                </div>
                                <button 
                                    onClick={() => toggleMember(person.id)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                                        selectedMembers.has(person.id)
                                            ? 'bg-stone-200 dark:bg-white/20 text-stone-600 dark:text-white'
                                            : 'bg-primary/10 text-primary hover:bg-primary/20'
                                    }`}
                                >
                                    {selectedMembers.has(person.id) ? 'Added' : 'Add'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={handleCreate}
                    disabled={!name.trim()}
                    className="w-full bg-primary hover:bg-primary-hover disabled:bg-stone-300 dark:disabled:bg-stone-700 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-full shadow-lg transition-colors flex items-center justify-center gap-2 mt-8 mb-8"
                >
                    Create Community {selectedMembers.size > 0 && `(${selectedMembers.size})`}
                </button>
            </div>
        </main>
      )}
    </div>
  );
};

export default NewCommunityScreen;

