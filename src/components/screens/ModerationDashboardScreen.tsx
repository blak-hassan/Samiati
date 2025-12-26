import React, { useState } from 'react';
import { Screen } from '@/types';
import { Brain, ShieldAlert, Zap, AlertCircle, Clock } from 'lucide-react';

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
  isEmbedded?: boolean;
}

interface ReportItem {
  id: string;
  reasons: string[];
  content: string;
  contextTitle: string;
  reporter: string;
  otherReporters?: number;
  type: 'comment' | 'link';
  actions: ('Hide' | 'Delete' | 'Approve' | 'Warn User')[];
  timestamp: number;
  aiAnalysis?: {
    score: number; // 0-100 probability of violation
    suggestion: 'Hide' | 'Delete' | 'Approve' | 'None';
    reason: string;
  };
  otherModeratorViewing?: {
    name: string;
    avatar: string;
  };
}

const INITIAL_REPORTS: ReportItem[] = [
  {
    id: '1',
    reasons: ['Spam', 'Inappropriate'],
    content: '"This comment is completely off-topic and rude. Where are the mods?"',
    contextTitle: 'The Lost Kingdom of Benin',
    reporter: '@Kwame_A',
    otherReporters: 3,
    type: 'comment',
    actions: ['Hide', 'Delete', 'Approve'],
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    aiAnalysis: {
      score: 85,
      suggestion: 'Hide',
      reason: 'Detected high probability of community guideline violation (Harassment).'
    },
    otherModeratorViewing: {
      name: 'Sarah M.',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHGQCh7G1VnjuVj9331GPw-eizTILg3UcwDA4ENWzw4Y4k-YeCgWzwUxAmYXQWIcfUfbQwVHw6sT-X-LP9EspDfXqNOQnm6QUcAN3d9HAxoEJ5kesDAP6W6EUQ6odygBf2Q2-wGIcEgisM6jeCizwsbd9roCE4EDfeK74dHdCooeQh3_eioZBLFJNPfGi8Cp4ke9oJ11DKdl5pNseP-GKgaT-tyieX9Uimavj73AayhR3msq3f9Dcw-BdgSJNRK5-7MQYX9T0wH_8'
    }
  },
  {
    id: '2',
    reasons: ['Misinformation'],
    content: '"This is historically inaccurate. The Nok civilization predates this by centuries. Everyone should read the real history."',
    contextTitle: 'The Art of Ife',
    reporter: '@Amina.B',
    type: 'comment',
    actions: ['Warn User', 'Delete', 'Approve'],
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    aiAnalysis: {
      score: 15,
      suggestion: 'Approve',
      reason: 'Content appears to be a civil historical debate.'
    }
  },
  {
    id: '3',
    reasons: ['Hate Speech'],
    content: '"I can\'t believe people still listen to this kind of nonsense. It\'s just tribal propaganda."',
    contextTitle: 'Oral Traditions of the Maasai',
    reporter: '@Femi_O',
    otherReporters: 7,
    type: 'comment',
    actions: ['Hide', 'Delete', 'Approve'],
    timestamp: Date.now() - 1000 * 60 * 30, // 30 mins ago
    aiAnalysis: {
      score: 92,
      suggestion: 'Delete',
      reason: 'Detected hate speech and inflammatory tribal content.'
    }
  },
  {
    id: '4',
    reasons: ['Malicious Link'],
    content: 'http://suspicious-site.com/free-money',
    contextTitle: 'Community Resources',
    reporter: '@System',
    otherReporters: 0,
    type: 'link',
    actions: ['Delete', 'Approve'],
    timestamp: Date.now() - 1000 * 60 * 5, // 5 mins ago
    aiAnalysis: {
      score: 99,
      suggestion: 'Delete',
      reason: 'Link matches known phishing database patterns.'
    }
  },
  {
    id: '5',
    reasons: ['Spam'],
    content: 'Check out my profile for quick cash!',
    contextTitle: 'Proverb of the Day',
    reporter: '@BotHunter',
    otherReporters: 1,
    type: 'comment',
    actions: ['Delete', 'Approve'],
    timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
    aiAnalysis: {
      score: 88,
      suggestion: 'Delete',
      reason: 'Repetitive spam pattern detected across multiple posts.'
    }
  }
];

const ModerationDashboardScreen: React.FC<Props> = ({ navigate, goBack, isEmbedded = false }) => {
  const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter States
  const [activeTab, setActiveTab] = useState<'comment' | 'link'>('comment');
  const [sortBy, setSortBy] = useState<'date' | 'severity'>('date');
  const [filterReason, setFilterReason] = useState<string>('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const handleAction = (id: string, action: string) => {
    // Remove the item from the list to simulate processing
    setReports(prev => prev.filter(item => item.id !== id));

    // Set feedback message
    let message = '';
    switch (action) {
      case 'Hide': message = 'Content hidden from public view.'; break;
      case 'Delete': message = 'Content permanently deleted.'; break;
      case 'Approve': message = 'Report dismissed. Content remains visible.'; break;
      case 'Warn User': message = 'User has been sent a warning.'; break;
      default: message = 'Action completed.';
    }
    setToastMessage(message);

    // Clear toast after 3 seconds
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getReasonColor = (reason: string) => {
    if (reason === 'Hate Speech' || reason.includes('Spam')) return 'text-rasta-red font-bold';
    if (reason === 'Misinformation') return 'text-rasta-gold font-bold';
    return 'text-rasta-red';
  };

  const getButtonColor = (action: string) => {
    switch (action) {
      case 'Approve': return 'bg-rasta-green text-white hover:bg-rasta-green/90';
      case 'Delete': return 'bg-rasta-red text-white hover:bg-rasta-red/90';
      case 'Warn User': return 'bg-rasta-gold text-stone-900 hover:bg-rasta-gold/90';
      default: return 'bg-black/5 dark:bg-white/5 text-stone-800 dark:text-white hover:bg-black/10 dark:hover:bg-white/10';
    }
  };

  const filteredReports = reports
    .filter(item => item.type === activeTab)
    .filter(item => {
      if (filterReason === 'All') return true;
      return item.reasons.some(r => r.includes(filterReason));
    })
    .filter(item =>
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.contextTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reporter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reasons.some(r => r.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'severity') {
        const aSev = (a.otherReporters || 0);
        const bSev = (b.otherReporters || 0);
        return bSev - aSev; // Descending
      }
      return b.timestamp - a.timestamp; // Newest first
    });

  const commentCount = reports.filter(r => r.type === 'comment').length;
  const linkCount = reports.filter(r => r.type === 'link').length;

  return (
    <div className={`flex flex-col h-full bg-background-light dark:bg-background-dark relative transition-colors duration-300 ${!isEmbedded ? 'min-h-screen' : ''}`}>
      {!isEmbedded && (
        <header className="flex items-center p-4 sticky top-0 bg-background-light dark:bg-background-dark z-20 border-b border-black/5 dark:border-transparent transition-colors">
          <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white"><span className="material-symbols-outlined">arrow_back</span></button>
          <h1 className="flex-1 text-center text-lg font-bold text-stone-900 dark:text-white pr-8">Moderation Dashboard</h1>
        </header>
      )}

      {/* Tabs */}
      <div className={`flex border-b border-stone-300 dark:border-warm-dark-brown sticky bg-background-light dark:bg-background-dark z-10 px-4 transition-colors ${!isEmbedded ? 'top-[60px]' : 'top-0'}`}>
        <button
          onClick={() => { setActiveTab('comment'); setFilterReason('All'); }}
          className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'comment' ? 'text-stone-900 dark:text-white border-b-2 border-primary' : 'text-stone-500 dark:text-text-muted border-b-2 border-transparent'}`}
        >
          Reported Comments ({commentCount})
        </button>
        <button
          onClick={() => { setActiveTab('link'); setFilterReason('All'); }}
          className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'link' ? 'text-stone-900 dark:text-white border-b-2 border-primary' : 'text-stone-500 dark:text-text-muted border-b-2 border-transparent'}`}
        >
          Pending Links ({linkCount})
        </button>
      </div>

      {/* Statistics Dashboard */}
      <div className="px-4 py-4 bg-white dark:bg-[#32241a] border-b border-black/5 dark:border-white/5">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-primary/10 rounded-xl p-3 border border-primary/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-lg">pending_actions</span>
              <p className="text-[10px] text-primary font-black uppercase tracking-wider">Pending</p>
            </div>
            <p className="text-2xl font-black text-stone-900 dark:text-white">{reports.length}</p>
          </div>

          <div className="bg-rasta-green/10 rounded-xl p-3 border border-rasta-green/10">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-4 h-4 text-rasta-green" />
              <p className="text-[10px] text-rasta-green font-black uppercase tracking-wider">AI Health</p>
            </div>
            <p className="text-xl font-black text-foreground">98.2%</p>
          </div>

          <div className="bg-rasta-gold/10 rounded-xl p-3 border border-rasta-gold/10">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-rasta-gold" />
              <p className="text-[10px] text-rasta-gold font-black uppercase tracking-wider">Avg Time</p>
            </div>
            <p className="text-2xl font-black text-stone-900 dark:text-white">~15<span className="text-xs font-bold opacity-60 ml-0.5">m</span></p>
          </div>
        </div>
      </div>

      {/* Filter / Search */}
      <div className="px-4 py-3 space-y-3">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-3.5 text-text-muted">search</span>
          <input
            type="text"
            placeholder={`Search ${activeTab} reports...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/5 dark:bg-[#473324] border-none rounded-xl py-3 pl-12 pr-4 text-stone-900 dark:text-white placeholder-text-muted focus:ring-0 outline-none transition-colors"
          />
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          {/* Combined Filter & Sort Menu */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors bg-black/5 dark:bg-[#473324] text-stone-900 dark:text-white hover:bg-black/10 dark:hover:bg-[#5a4230]`}
            >
              <span className="material-symbols-outlined text-lg">tune</span>
              <span>Filter & Sort</span>
              <span className="material-symbols-outlined text-lg transition-transform duration-200" style={{ transform: showFilterMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
            </button>

            {showFilterMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowFilterMenu(false)}></div>
                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#32241a] shadow-xl rounded-xl z-30 border border-stone-200 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">

                  {/* Filter Section */}
                  <div className="p-2 border-b border-black/5 dark:border-white/5">
                    <span className="text-xs font-bold text-stone-500 dark:text-text-muted px-2 mb-1 block uppercase tracking-wider">Reason</span>
                    {['All', 'Spam', 'Hate Speech', 'Misinformation', 'Inappropriate'].map(reason => (
                      <button
                        key={reason}
                        onClick={() => { setFilterReason(reason); setShowFilterMenu(false); }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 ${filterReason === reason ? 'bg-primary text-white' : 'hover:bg-black/5 dark:hover:bg-white/5 text-stone-800 dark:text-white'}`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{reason}</span>
                          {filterReason === reason && <span className="material-symbols-outlined text-sm">check</span>}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Sort Section */}
                  <div className="p-2 bg-stone-50/50 dark:bg-black/10">
                    <span className="text-xs font-bold text-stone-500 dark:text-text-muted px-2 mb-1 block uppercase tracking-wider">Sort by</span>
                    {[
                      { id: 'date', label: 'Date (Newest)' },
                      { id: 'severity', label: 'Severity (High to Low)' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => { setSortBy(opt.id as any); setShowFilterMenu(false); }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 ${sortBy === opt.id ? 'bg-stone-200 dark:bg-white/20 text-stone-900 dark:text-white font-semibold' : 'hover:bg-black/5 dark:hover:bg-white/5 text-stone-800 dark:text-white'}`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{opt.label}</span>
                          {sortBy === opt.id && <span className="material-symbols-outlined text-sm">check</span>}
                        </div>
                      </button>
                    ))}
                  </div>

                </div>
              </>
            )}
          </div>

          {/* Active Filter Chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1">
            {filterReason !== 'All' && (
              <button
                onClick={() => setFilterReason('All')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg border border-primary/20 whitespace-nowrap animate-in fade-in"
              >
                {filterReason} <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
            {sortBy === 'severity' && (
              <button
                onClick={() => setSortBy('date')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-200 dark:bg-white/10 text-stone-700 dark:text-text-muted text-xs font-bold rounded-lg whitespace-nowrap animate-in fade-in"
              >
                Severity <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <main className="flex-1 p-4 pt-0 space-y-4 pb-24 overflow-y-auto">
        {filteredReports.length > 0 ? (
          filteredReports.map((item) => (
            <div key={item.id} className="bg-white dark:bg-[#32241a] rounded-xl p-4 shadow-sm space-y-3 transition-colors animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between items-start">
                <p className="text-sm text-stone-600 dark:text-text-muted">
                  Reported for: <span className={`font-semibold ${getReasonColor(item.reasons[0])}`}>{item.reasons.join(', ')}</span>
                </p>
                <span className="text-xs text-stone-400 dark:text-text-muted/60">
                  {Math.floor((Date.now() - item.timestamp) / (1000 * 60))}m ago
                </span>
              </div>

              {/* Real-time Moderator Activity */}
              {item.otherModeratorViewing && (
                <div className="flex items-center gap-2 bg-rasta-gold/10 border border-rasta-gold/20 rounded-lg px-3 py-2 animate-pulse mb-1">
                  <div className="flex -space-x-2">
                    <img src={item.otherModeratorViewing.avatar} alt={item.otherModeratorViewing.name} className="w-5 h-5 rounded-full border border-white dark:border-surface-dark" />
                  </div>
                  <p className="text-[10px] font-bold text-amber-600 dark:text-rasta-gold">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-rasta-gold mr-1.5"></span>
                    {item.otherModeratorViewing.name} is currently reviewing this
                  </p>
                </div>
              )}

              <p className="text-lg font-bold text-stone-900 dark:text-white break-words">
                {item.type === 'link' ? (
                  <button
                    onClick={() => window.open(item.content, '_blank')}
                    className="text-primary hover:underline flex items-center gap-1 text-left"
                  >
                    <span className="material-symbols-outlined text-sm">link</span>
                    {item.content}
                  </button>
                ) : item.content}
              </p>

              {/* AI Analysis Card */}
              {item.aiAnalysis && (
                <div className="bg-gradient-to-r from-rasta-gold/10 to-primary/10 border border-rasta-gold/20 rounded-xl p-4 space-y-3 relative overflow-hidden group/ai">
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rasta-gold flex items-center justify-center text-white shadow-lg shadow-rasta-gold/20">
                        <Brain className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-amber-600 dark:text-rasta-gold uppercase tracking-widest">AI Assisted Review</p>
                        <h4 className="text-xs font-black text-foreground">Flagged Content Analysis</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white dark:bg-surface-dark px-3 py-1.5 rounded-full border border-rasta-gold/20 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-rasta-gold animate-pulse"></div>
                      <span className="text-xs font-black text-amber-600 dark:text-rasta-gold">{item.aiAnalysis.score}%</span>
                    </div>
                  </div>

                  <div className="flex gap-2 relative z-10">
                    <div className="p-2 bg-rasta-gold/10 rounded-lg h-fit">
                      <ShieldAlert className="w-4 h-4 text-rasta-gold" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-800 dark:text-sand-beige mb-1">Recommendation: {item.aiAnalysis.suggestion}</p>
                      <p className="text-xs text-stone-600 dark:text-text-muted leading-relaxed">
                        {item.aiAnalysis.reason}
                      </p>
                    </div>
                  </div>

                  {/* Subtle background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rasta-gold/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none group-hover/ai:scale-110 transition-transform duration-700"></div>
                </div>
              )}

              <div className="text-sm text-stone-600 dark:text-text-muted bg-stone-50 dark:bg-black/20 p-3 rounded-lg">
                <p>In {item.type === 'link' ? 'Resource' : 'Story'}: <span
                  onClick={() => navigate(item.type === 'link' ? Screen.SUGGEST_LINK : Screen.STORY_DETAIL)}
                  className="text-primary hover:underline cursor-pointer font-medium"
                >{item.contextTitle}</span></p>
                <p className="mt-1">
                  Reported <span className="font-bold">{item.otherReporters ? item.otherReporters + 1 : 1}</span> times by <span
                    onClick={() => navigate(Screen.PROFILE)}
                    className="text-primary hover:underline cursor-pointer"
                  >{item.reporter}</span>
                  {item.otherReporters ? ` and ${item.otherReporters} others` : ''}
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/5 flex-wrap">
                {item.actions.map(action => (
                  <button
                    key={action}
                    onClick={() => handleAction(item.id, action)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-transform active:scale-95 ${getButtonColor(action)}`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          /* Empty / No Results */
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-stone-200 dark:border-white/10 rounded-xl mt-4">
            <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-white/5 flex items-center justify-center text-stone-400 dark:text-text-muted mb-4">
              <span className="material-symbols-outlined text-3xl">search_off</span>
            </div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white">No reports found</h3>
            <p className="text-stone-600 dark:text-text-muted text-center max-w-xs">
              {searchQuery ? `No ${activeTab} reports match "${searchQuery}"` : `There are no ${activeTab} reports with this filter.`}
            </p>
            {(searchQuery || filterReason !== 'All') && (
              <button
                onClick={() => { setSearchQuery(''); setFilterReason('All'); }}
                className="mt-4 text-primary font-bold hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {reports.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-stone-200 dark:border-white/10 rounded-xl mt-4">
            <div className="w-16 h-16 rounded-full bg-rasta-green/20 flex items-center justify-center text-rasta-green mb-4">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white">All caught up!</h3>
            <p className="text-stone-600 dark:text-text-muted">There are no items to review.</p>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-6 py-3 rounded-full shadow-xl flex items-center gap-3 transition-all duration-300 z-50 animate-in fade-in slide-in-from-bottom-4">
          <span className="material-symbols-outlined text-rasta-green">check_circle</span>
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default ModerationDashboardScreen;
