"use client";

import React, { useState, useMemo } from 'react';
import { Screen, ValidationItem, LanguageHealth } from '@/types';
import { NotificationBell } from '@/components/shared/NotificationBell';
import {
  Brain,
  ShieldAlert,
  Clock,
  ArrowLeft,
  SlidersHorizontal,
  ChevronDown,
  Check,
  Search,
  X,
  SearchX,
  CheckCircle2,
  Filter,
  RefreshCw,
  Trophy,
  Zap
} from 'lucide-react';

// New Components
import { LanguageHealthWidget } from '@/components/moderation/LanguageHealthWidget';
import { ValidationCard } from '@/components/moderation/ValidationCard';
import { CritiqueModal } from '@/components/moderation/CritiqueModal';
import { ReportModal } from '@/components/moderation/ReportModal';

// Mock Data
import { INITIAL_LANGUAGE_HEALTH, INITIAL_VALIDATION_ITEMS } from '@/data/mock';

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
  unreadCount?: number;
  isEmbedded?: boolean;
}

const CURRENT_USER_ID = 'u_current'; // Simulated current user

const ModerationDashboardScreen: React.FC<Props> = ({
  navigate,
  goBack,
  unreadCount = 0,
  isEmbedded = false
}) => {
  // State
  const [items, setItems] = useState<ValidationItem[]>(INITIAL_VALIDATION_ITEMS);
  const [languages] = useState<LanguageHealth[]>(INITIAL_LANGUAGE_HEALTH);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string, type: 'success' | 'warning' | 'error' } | null>(null);

  // Filter States
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Modal States
  const [critiqueModal, setCritiqueModal] = useState<{ isOpen: boolean; itemId: string | null; title: string }>({
    isOpen: false,
    itemId: null,
    title: ''
  });
  const [reportModal, setReportModal] = useState<{ isOpen: boolean; itemId: string | null }>({
    isOpen: false,
    itemId: null
  });

  // Derived Stats
  const stats = useMemo(() => {
    return {
      pending: items.filter(i => i.status === 'pending').length,
      validated: items.filter(i => i.status === 'approved' || i.status === 'rejected' || i.status === 'needs_revision').length,
      approved: items.filter(i => i.status === 'approved').length,
      totalLanguages: languages.filter(l => l.isUserModerator).length
    };
  }, [items, languages]);

  // Simple fuzzy match helper
  const fuzzyMatch = (text: string, query: string) => {
    text = text.toLowerCase();
    query = query.toLowerCase();
    let j = 0;
    for (let i = 0; i < text.length && j < query.length; i++) {
      if (text[i] === query[j]) j++;
    }
    return j === query.length;
  };

  // Filtering Logic
  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        // Only show languages the user is a moderator for OR items the user authored
        const isUserModeratorForLang = languages.find(l => l.code === item.languageCode)?.isUserModerator;
        const isAuthoredByUser = item.author.id === CURRENT_USER_ID;
        return isUserModeratorForLang || isAuthoredByUser;
      })
      .filter(item => {
        if (selectedLanguageCode && item.languageCode !== selectedLanguageCode) return false;
        if (activeType !== 'All' && item.type !== activeType) return false;

        if (selectedStatus) {
          if (selectedStatus === 'approved' && item.status !== 'approved') return false;
          if (selectedStatus === 'pending' && item.status !== 'pending') return false;
          if (selectedStatus === 'rejected' && (item.status === 'rejected' || item.status === 'needs_revision')) return true; // Group rejected and needs revision logic if needed, but strict for now
          if (selectedStatus === 'rejected' && item.status !== 'rejected') return false;
        }

        if (searchQuery) {
          return (
            fuzzyMatch(item.content.original, searchQuery) ||
            (item.content.translation && fuzzyMatch(item.content.translation, searchQuery)) ||
            fuzzyMatch(item.author.name, searchQuery) ||
            fuzzyMatch(item.type, searchQuery)
          );
        }
        return true;
      })
      .sort((a, b) => {
        // This is a simple mock sort as we don't have real dates
        return sortBy === 'newest' ? -1 : 1;
      });
  }, [items, selectedLanguageCode, activeType, searchQuery, sortBy, languages, selectedStatus]);

  // Handlers
  const handleApprove = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? {
        ...item,
        status: 'approved',
        reviews: [
          ...item.reviews,
          {
            moderator: { id: CURRENT_USER_ID, name: 'You', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeLXbWz4AzkUBDUb3vYkhuHrvvC9EFxb7YuDTFXSRV6e6T547HBjftD2_M3MWQ23u8DdygDU3-kcrmReHHcg1xuI2vz_fBK_UAfIaTV6tCpEh1xW7vkPs6qjbSwVjkqUkPXcPuBDRL_I0E_dA3ckyiMN2POsZ3M2E57RwaQqNiSED1NzWUTMmbbesb_Ko-z2BYoXtkkWP0lVOyL0aKlkzlpsNevnW1dPGKRZ5SxqpNtu6pvvjeFLtIUcElhd54x2R98mDwi_k8K4w' },
            action: 'approved',
            timestamp: Date.now()
          }
        ]
      } : item
    ));
    showToast('Contribution validated for AI training!', 'success');
  };

  const handleVote = (id: string, direction: 'up' | 'down' | null) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;

      let newUpvotes = item.sentiment.upvotes;
      let newDownvotes = item.sentiment.downvotes;
      const oldVote = item.sentiment.userVote;

      // Remove old vote effect
      if (oldVote === 'up') newUpvotes--;
      if (oldVote === 'down') newDownvotes--;

      // Apply new vote
      if (direction === 'up') newUpvotes++;
      if (direction === 'down') newDownvotes++;

      // POST APPROVAL LOGIC:
      // Criteria: 10 Upvotes = Auto-Approve
      // This allows the community to push high-quality content live without moderator intervention.
      let newStatus = item.status;
      if (newUpvotes >= 10 && newStatus === 'pending') {
        newStatus = 'approved';
        showToast('Community consensus reached: Post is now Live!', 'success');
      }

      return {
        ...item,
        status: newStatus,
        sentiment: {
          ...item.sentiment,
          upvotes: newUpvotes,
          downvotes: newDownvotes,
          userVote: direction
        }
      };
    }));
  };

  const handleCritique = (id: string, comment: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? {
        ...item,
        status: 'needs_revision',
        reviews: [
          ...item.reviews,
          {
            moderator: { id: CURRENT_USER_ID, name: 'You', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeLXbWz4AzkUBDUb3vYkhuHrvvC9EFxb7YuDTFXSRV6e6T547HBjftD2_M3MWQ23u8DdygDU3-kcrmReHHcg1xuI2vz_fBK_UAfIaTV6tCpEh1xW7vkPs6qjbSwVjkqUkPXcPuBDRL_I0E_dA3ckyiMN2POsZ3M2E57RwaQqNiSED1NzWUTMmbbesb_Ko-z2BYoXtkkWP0lVOyL0aKlkzlpsNevnW1dPGKRZ5SxqpNtu6pvvjeFLtIUcElhd54x2R98mDwi_k8K4w' },
            action: 'critiqued',
            comment,
            timestamp: Date.now()
          }
        ]
      } : item
    ));
    setCritiqueModal({ isOpen: false, itemId: null, title: '' });
    showToast('Feedback submitted to author.', 'warning');
  };

  const handleReport = (id: string, reason: string, details?: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;

      // AUTO-SUSPENSION LOGIC:
      // Criteria: 2 Flags = Auto-Reject/Suspend
      // High-risk content is hidden immediately when multiple users or a moderator flags it.
      // In this frontend implementation, a moderator report is an instant rejection.
      const newStatus = 'rejected';
      showToast(`Content flagged for quality: ${reason}`, 'error');

      return {
        ...item,
        status: newStatus,
        reviews: [
          ...item.reviews,
          {
            moderator: { id: CURRENT_USER_ID, name: 'You', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeLXbWz4AzkUBDUb3vYkhuHrvvC9EFxb7YuDTFXSRV6e6T547HBjftD2_M3MWQ23u8DdygDU3-kcrmReHHcg1xuI2vz_fBK_UAfIaTV6tCpEh1xW7vkPs6qjbSwVjkqUkPXcPuBDRL_I0E_dA3ckyiMN2POsZ3M2E57RwaQqNiSED1NzWUTMmbbesb_Ko-z2BYoXtkkWP0lVOyL0aKlkzlpsNevnW1dPGKRZ5SxqpNtu6pvvjeFLtIUcElhd54x2R98mDwi_k8K4w' },
            action: 'rejected',
            comment: reason + (details ? `: ${details}` : ''),
            timestamp: Date.now()
          }
        ]
      };
    }));
    setReportModal({ isOpen: false, itemId: null });
  };

  const showToast = (text: string, type: 'success' | 'warning' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className={`flex flex-col h-full bg-background-light dark:bg-background-dark relative transition-colors duration-300 ${!isEmbedded ? 'min-h-screen' : ''}`}>
      {!isEmbedded && (
        <header className="flex items-center p-4 sticky top-0 bg-background-light dark:bg-background-dark z-20 border-b border-black/5 dark:border-transparent transition-colors">
          <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 flex flex-col items-center">
            <h1 className="text-lg font-black text-stone-900 dark:text-white">Validation Hub</h1>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">AI Training Data Center</p>
          </div>
          <NotificationBell unreadCount={unreadCount} onNavigate={navigate} />
        </header>
      )}

      <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar pb-24">
        {/* Statistics Banner */}
        <div className="px-4 py-4 bg-white dark:bg-[#32241a] border-b border-black/5 dark:border-white/5">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setSelectedStatus(selectedStatus === 'pending' ? null : 'pending')}
              className={`rounded-2xl p-3 border relative overflow-hidden group transition-all text-left ${selectedStatus === 'pending' ? 'bg-rasta-gold border-rasta-gold ring-2 ring-rasta-gold/30 shadow-lg scale-105' : 'bg-rasta-gold/10 border-rasta-gold/10 hover:border-rasta-gold'}`}
            >
              <div className="flex items-center gap-2 mb-1 relative z-10">
                <Clock className={`size-3 ${selectedStatus === 'pending' ? 'text-stone-900' : 'text-rasta-gold'}`} />
                <p className={`text-[9px] font-black uppercase tracking-wider ${selectedStatus === 'pending' ? 'text-stone-900' : 'text-rasta-gold'}`}>Pending</p>
              </div>
              <p className={`text-xl font-black relative z-10 ${selectedStatus === 'pending' ? 'text-stone-900' : 'text-stone-900 dark:text-white'}`}>{stats.pending}</p>
              <div className="absolute -right-2 -bottom-2 size-12 bg-rasta-gold/20 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
            </button>

            <button
              onClick={() => setSelectedStatus(null)} // Validated is general, but lets use it to clear or maybe show all validated? Actually lets make it show 'Validated' (approved + rejected/done)
              className="bg-rasta-green/10 rounded-2xl p-3 border border-rasta-green/10 relative overflow-hidden group text-left transition-all hover:bg-rasta-green/20"
            >
              <div className="flex items-center gap-2 mb-1 relative z-10">
                <CheckCircle2 className="size-3 text-rasta-green" />
                <p className="text-[9px] text-rasta-green font-black uppercase tracking-wider">Validated</p>
              </div>
              <p className="text-xl font-black text-stone-900 dark:text-white relative z-10">{stats.validated}</p>
              <div className="absolute -right-2 -bottom-2 size-12 bg-rasta-green/5 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
            </button>

            <button
              onClick={() => setSelectedStatus(selectedStatus === 'approved' ? null : 'approved')}
              className={`rounded-2xl p-3 border relative overflow-hidden group transition-all text-left ${selectedStatus === 'approved' ? 'bg-primary border-primary ring-2 ring-primary/30 shadow-lg scale-105' : 'bg-primary/10 border-primary/10 hover:border-primary'}`}
            >
              <div className="flex items-center gap-2 mb-1 relative z-10">
                <Zap className={`size-3 ${selectedStatus === 'approved' ? 'text-white' : 'text-primary'}`} />
                <p className={`text-[9px] font-black uppercase tracking-wider ${selectedStatus === 'approved' ? 'text-white' : 'text-primary'}`}>Approved</p>
              </div>
              <p className={`text-xl font-black relative z-10 ${selectedStatus === 'approved' ? 'text-white' : 'text-stone-900 dark:text-white'}`}>{stats.approved}</p>
              <div className="absolute -right-2 -bottom-2 size-12 bg-primary/20 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
            </button>
          </div>
        </div>

        {/* Language Health Widget */}
        <div className="pt-6">
          <LanguageHealthWidget
            languages={languages}
            selectedLanguage={selectedLanguageCode}
            onSelectLanguage={setSelectedLanguageCode}
          />
        </div>

        {/* Filter & Search Section */}
        <div className="px-4 py-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 size-5 text-stone-400" />
            <input
              type="text"
              placeholder="Search content, authors, or types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/5 dark:bg-[#473324] border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-text-muted/40 focus:ring-2 focus:ring-primary transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${showFilterMenu || activeType !== 'All' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-black/5 dark:bg-[#473324] text-stone-600 dark:text-text-muted hover:bg-black/10'}`}
              >
                <SlidersHorizontal className="size-3" />
                Filter
                {activeType !== 'All' && <span className="size-1.5 rounded-full bg-white ml-1" />}
              </button>

              {showFilterMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowFilterMenu(false)}></div>
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#32241a] shadow-2xl rounded-2xl z-40 border border-stone-100 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-black/20">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Status</p>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {[
                          { label: 'Pending', value: 'pending', color: 'bg-rasta-gold/20 text-rasta-gold border-rasta-gold/20' },
                          { label: 'Approved', value: 'approved', color: 'bg-primary/20 text-primary border-primary/20' },
                          { label: 'Validated', value: null, color: 'bg-rasta-green/20 text-rasta-green border-rasta-green/20' },
                          { label: 'Rejected', value: 'rejected', color: 'bg-rasta-red/20 text-rasta-red border-rasta-red/20' }
                        ].map(status => (
                          <button
                            key={status.label}
                            onClick={() => { setSelectedStatus(status.value as any); setShowFilterMenu(false); }}
                            className={`px-3 py-2 rounded-lg text-[10px] font-bold text-center transition-all border ${selectedStatus === status.value ? 'bg-stone-900 text-white border-stone-900' : status.color} hover:opacity-80`}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Contribution Type</p>
                      <div className="grid grid-cols-2 gap-2">
                        {['All', 'Story', 'Word', 'Proverb', 'Song', 'Phrases'].map(type => (
                          <button
                            key={type}
                            onClick={() => { setActiveType(type); setShowFilterMenu(false); }}
                            className={`px-3 py-2 rounded-lg text-[10px] font-bold text-left transition-all ${activeType === type ? 'bg-primary text-white' : 'bg-white dark:bg-[#473324] text-stone-600 dark:text-sand-beige hover:border-primary/50 border border-transparent'}`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Sort Order</p>
                      <div className="flex bg-black/5 dark:bg-black/40 rounded-xl p-1">
                        <button
                          onClick={() => setSortBy('newest')}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'newest' ? 'bg-white dark:bg-[#473324] text-primary shadow-sm' : 'text-stone-400'}`}
                        >
                          Newest
                        </button>
                        <button
                          onClick={() => setSortBy('oldest')}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'oldest' ? 'bg-white dark:bg-[#473324] text-primary shadow-sm' : 'text-stone-400'}`}
                        >
                          Oldest
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
              {activeType !== 'All' && (
                <button onClick={() => setActiveType('All')} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-black rounded-lg border border-primary/20 animate-in fade-in zoom-in">
                  {activeType} <X className="size-3" />
                </button>
              )}
              {selectedLanguageCode && (
                <button onClick={() => setSelectedLanguageCode(null)} className="flex items-center gap-1.5 px-3 py-1.5 bg-rasta-green/10 text-rasta-green text-[10px] font-black rounded-lg border border-rasta-green/20 animate-in fade-in zoom-in">
                  {languages.find(l => l.code === selectedLanguageCode)?.name} <X className="size-3" />
                </button>
              )}
              {selectedStatus && (
                <button onClick={() => setSelectedStatus(null)} className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-white text-[10px] font-black rounded-lg border border-stone-200 dark:border-white/10 animate-in fade-in zoom-in">
                  {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)} <X className="size-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content List */}
        <div className="px-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-stone-400 dark:text-text-muted/60">
              {filteredItems.length} Contributions to review
            </h2>
            <button className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
              <RefreshCw className="size-4" />
            </button>
          </div>

          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <ValidationCard
                key={item.id}
                item={item}
                currentUserId={CURRENT_USER_ID}
                isUserModerator={languages.find(l => l.code === item.languageCode)?.isUserModerator || false}
                onApprove={handleApprove}
                onCritique={() => setCritiqueModal({ isOpen: true, itemId: item.id, title: item.content.original })}
                onReport={() => setReportModal({ isOpen: true, itemId: item.id })}
                onViewProfile={(handle) => navigate(Screen.PROFILE)}
                onNavigate={navigate}
                onVote={handleVote}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-10 text-center animate-in fade-in zoom-in duration-500">
              <div className="size-20 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                <SearchX className="size-10 text-stone-300" />
              </div>
              <h3 className="text-lg font-black text-stone-900 dark:text-white mb-2">No matching contributions</h3>
              <p className="text-sm text-stone-500 dark:text-text-muted leading-relaxed max-w-xs">
                We couldn't find any items matching your current filters. Try adjusting your language or type settings.
              </p>
              <button
                onClick={() => {
                  setActiveType('All');
                  setSelectedLanguageCode(null);
                  setSelectedStatus(null);
                  setSearchQuery('');
                }}
                className="mt-6 px-6 py-2 bg-primary text-white text-xs font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <CritiqueModal
        isOpen={critiqueModal.isOpen}
        onClose={() => setCritiqueModal({ isOpen: false, itemId: null, title: '' })}
        onSubmit={(comment) => handleCritique(critiqueModal.itemId!, comment)}
        itemTitle={critiqueModal.title}
      />
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ isOpen: false, itemId: null })}
        onSubmit={(reason, details) => handleReport(reportModal.itemId!, reason, details)}
      />

      {/* Reward Notification (Gamification) */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2">
        <div className="bg-rasta-gold text-stone-900 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-500 group cursor-pointer hover:scale-105 active:scale-95 transition-all border-2 border-white/20">
          <Trophy className="size-5" />
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-tighter">Daily Goal</p>
            <p className="text-xs font-black">Level 12 • 850/1000 XP</p>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-8 left-4 right-4 z-[70] p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 transition-all duration-300 ${toastMessage.type === 'success' ? 'bg-rasta-green text-white' :
          toastMessage.type === 'warning' ? 'bg-rasta-gold text-stone-900' : 'bg-rasta-red text-white'
          }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="size-5" /> : <ShieldAlert className="size-5" />}
          <span className="text-sm font-black">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-auto opacity-50 hover:opacity-100 transition-opacity"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ModerationDashboardScreen;
