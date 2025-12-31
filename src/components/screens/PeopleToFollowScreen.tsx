"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Screen, User, ContributionItem } from '@/types';
import { Person, useWatuFilters } from '@/hooks/useWatuFilters';
import { useComments } from '@/hooks/useComments';
import { WatuHeader } from '@/components/watu/WatuHeader';
import { WatuFilters } from '@/components/watu/WatuFilters';
import { WatuUserCard } from '@/components/watu/WatuUserCard';
import { WatuPostCard } from '@/components/watu/WatuPostCard';
import { WatuEmptyState } from '@/components/watu/WatuEmptyState';
import { Filter, ChevronDown, Check, UserPlus, Users, QrCode, Share2 } from 'lucide-react';

interface Props {
  navigate: (screen: Screen, params?: any) => void;
  goBack: () => void;
  onViewProfile: (user: User) => void;
  initialFilter?: string;
}

const CURRENT_USER_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuBeLXbWz4AzkUBDUb3vYkhuHrvvC9EFxb7YuDTFXSRV6e6T547HBjftD2_M3MWQ23u8DdygDU3-kcrmReHHcg1xuI2vz_fBK_UAfIaTV6tCpEh1xW7vkPs6qjbSwVjkqUkPXcPuBDRL_I0E_dA3ckyiMN2POsZ3M2E57RwaQqNiSED1NzWUTMmbbesb_Ko-z2BYoXtkkWP0lVOyL0aKlkzlpsNevnW1dPGKRZ5SxqpNtu6pvvjeFLtIUcElhd54x2R98mDwi_k8K4w";

const MOCK_PEOPLE: Person[] = [
  {
    id: '1',
    name: 'Kwame Mensah',
    handle: 'kwame_m',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuGLE0i9NWNJMGLNeeS7Y-fkwpi4GavU-5tFQGjerfZBUK9A2baVE6a0v9b6Le6AIX-Xejh_WCf4Bb8tk8yqNXUeyVehi927mNkXbnvMb3ggvQTzfMzZcJc0kPiyaqMcPlts57mpPxJLq5-lgGwTjXzXNGyasv8_llUjyNVB2m-dLngZv8en8HyHDdbU1j_Wt2xl1HDaHg_iKgKX7HviRx7y_sXmAmU_NNuzZlrcnkbqtGL8NTvNgBOFaC4sSZ5yd97zBiTylIkog',
    languages: ['Akan', 'English'],
    region: 'West Africa',
    isFollowing: false,
    role: 'Storyteller',
    about: 'Sharing the wisdom of the elders.',
    contributionCount: 127
  },
  {
    id: '2',
    name: 'Zahra Ali',
    handle: 'zahra_ali',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHGQCh7G1VnjuVj9331GPw-eizTILg3UcwDA4ENWzw4Y4k-YeCgWzwUxAmYXQWIcfUfbQwVHw6sT-X-LP9EspDfXqNOQnm6QUcAN3d9HAxoEJ5kesDAP6W6EUQ6odygBf2Q2-wGIcEgisM6jeCizwsbd9roCE4EDfeK74dHdCooeQh3_eioZBLFJNPfGi8Cp4ke9oJ11DKdl5pNseP-GKgaT-tyieX9Uimavj73AayhR3msq3f9Dcw-BdgSJNRK5-7MQYX9T0wH_8',
    languages: ['Swahili', 'Arabic'],
    region: 'East Africa',
    isFollowing: false,
    role: 'Historian',
    about: 'History is the key to our future.',
    contributionCount: 203
  },
  {
    id: '3',
    name: 'Chike Okoro',
    handle: 'chike_o',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCf35EoI1LYG_Z-DVruXrhf48EMhNAfhAbaIoN6aNxIOA7VWp8i9i-bmGhJmE0dqxwKZOscNOyTdZhqM8oDoilkrWcTxcmgWw_9TKUo8f2ASQEfAbbjXAelehx2KYPAN8W1qBGBDnvXJmTlMbdPIdPtbLjIMEeo6jhXcD7OkpFeAa7ECkhmLX-DoyYLYn3mUQ7yRcrIkO3DdTcFC-tZ0hxx31yGdTsr7k-44mC1gpIEDYR6Jk63r6sc1JtxESZ_z8CzlfVQD_p38c',
    languages: ['Igbo', 'English', 'Pidgin'],
    region: 'West Africa',
    isFollowing: true,
    role: 'Proverb Expert',
    about: 'Igbo kwenu!',
    contributionCount: 89
  },
  {
    id: '4',
    name: 'Fatou Sow',
    handle: 'fatou_s',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA33dgvI_8O1U2ZsGRRdIrN6msDVHDnzcOdKb2aEXmYC6BfYJvld3snbK7MQxEUsWkCLK5m9ry75kxZt9sfUj6Lj3S1keqVySoqqDOIddmUfbhh1NdpYKeiNphTGsh0op0pjtMhHziNPcUnCoOwh0BNylf0gclux6S7K-7-UHrGrvKE0tNqLQdIZ2zsi9R4Op0Mw2iKcHKarDj1ikZRS8LF2G1DNUTepgcMC76cBhfsNp4cHQ24AUuqP1KmseLie5Uq-O-YHLOwnM8',
    languages: ['Wolof', 'French'],
    region: 'West Africa',
    isFollowing: false,
    role: 'Musician',
    about: 'Music is life.',
    contributionCount: 45
  },
  {
    id: '5',
    name: 'Thabo Mokoena',
    handle: 'thabo_m',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6LZtwoRZLVf_mfFqdY11OX1RDMuLNBfzg-1-JqIap60sqItIczvKLkOwTmDA2J4pvgnJj5aFZAOk2PIeB-aYBeYRowNGFP8T6NhD2DXsMXeufNtSm-w5qmkobZjLTsvLwAACWIfN9watEHLy7hX6MckJh3IpQmn_5d1cs77_r6spZ27YrpgTvwW_gUlkhejzZ15PFd6Wav0M6iz-05tnZhk6UZkd-dSx3hIpX_jHEGKs4ob8uyhELqdeumxAYPV-uJ49KGz0AbDw',
    languages: ['Zulu', 'Xhosa', 'English'],
    region: 'Southern Africa',
    isFollowing: false,
    role: 'Community Elder',
    about: 'Ubuntu.',
    contributionCount: 156
  },
  {
    id: '6',
    name: 'Nala Bekele',
    handle: 'nala_b',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwIbRrqJ4ZJ8GZcDvg3A8ICBI_glwNU2kT-sFW7-8qY1XYmEp5OPUPcOp1LTcTEL-9WOzc1bMxyURmWkWyrBOe5qFmcJy1VwLlI3U2fRprY3C452LNhCV5ucydy-MWIfij3s9wB7Womu3RmxEVpEBd6YW7i0ty-O2kqgzw4oYkynhtJWwuEqnWs0dyjiruGe25Bcsxd76N3hCs8K0KoGsEYyeM8qS63xvzlpMaTz-GZK-kI1D7zM4blUhv-JzuvkPJODszYC07wbc',
    languages: ['Amharic', 'English'],
    region: 'East Africa',
    isFollowing: false,
    role: 'Writer',
    about: 'Words can change the world.',
    contributionCount: 72
  }
];

const HELPED_PEOPLE: Person[] = [
  {
    id: 'h1',
    name: 'Kofi A.',
    handle: 'kofi_arts',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeLXbWz4AzkUBDUb3vYkhuHrvvC9EFxb7YuDTFXSRV6e6T547HBjftD2_M3MWQ23u8DdygDU3-kcrmReHHcg1xuI2vz_fBK_UAfIaTV6tCpEh1xW7vkPs6qjbSwVjkqUkPXcPuBDRL_I0E_dA3ckyiMN2POsZ3M2E57RwaQqNiSED1NzWUTMmbbesb_Ko-z2BYoXtkkWP0lVOyL0aKlkzlpsNevnW1dPGKRZ5SxqpNtu6pvvjeFLtIUcElhd54x2R98mDwi_k8K4w',
    languages: ['Twi'],
    region: 'West Africa',
    isFollowing: true,
    role: 'Learner',
    about: 'Learning Twi.',
    contributionCount: 12
  },
  {
    id: 'h2',
    name: 'Sarah J.',
    handle: 'sarah_j',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTCkmqfVuPlLQ4IRyL2yV9d82xXGhUn6PZJQuyR-wOR0cvIaU2RmXVEYxrDKRF8LwvPO8ui_vLey4StEqf8CTMHBir5NqJ8BI6X6gXKzW2e5jtCmaOROPdLEoAJCmmFm51ht9zq7QwPnSBQC8TAqlJfRa5M4kLarJ9LqR6i2YIFBkKl3YmSCiPo77SFPw336bJQN6weNdBrPdUlu-Ta6wtwbzNsRkfyTwRr05-OJF-2JEsH1EwbuwH-dLxzpESsJxfK0fBRGIneoQ',
    languages: ['English', 'Swahili'],
    region: 'Diaspora',
    isFollowing: false,
    role: 'Student',
    about: 'Student of life.',
    contributionCount: 8
  }
];

const WATU_POSTS_DATA: ContributionItem[] = [
  {
    id: 'f1',
    type: 'Proverb',
    title: 'Wazee hukumbuka',
    subtitle: 'Proverb • Posted 2h ago',
    author: {
      name: 'Kwame Mensah',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuGLE0i9NWNJMGLNeeS7Y-fkwpi4GavU-5tFQGjerfZBUK9A2baVE6a0v9b6Le6AIX-Xejh_WCf4Bb8tk8yqNXUeyVehi927mNkXbnvMb3ggvQTzfMzZcJc0kPiyaqMcPlts57mpPxJLq5-lgGwTjXzXNGyasv8_llUjyNVB2m-dLngZv8en8HyHDdbU1j_Wt2xl1HDaHg_iKgKX7HviRx7y_sXmAmU_NNuzZlrcnkbqtGL8NTvNgBOFaC4sSZ5yd97zBiTylIkog',
      handle: 'kwame_m'
    },
    icon: 'format_quote',
    likes: 56,
    dislikes: 1,
    commentsCount: 5,
    userVote: null,
    showComments: false,
    comments: [],
    tags: ['Akan', 'Wisdom']
  },
  {
    id: 'f2',
    type: 'Story',
    title: 'The Lion\'s Gift',
    subtitle: 'Story • Posted 5h ago',
    author: {
      name: 'Zahra Ali',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHGQCh7G1VnjuVj9331GPw-eizTILg3UcwDA4ENWzw4Y4k-YeCgWzwUxAmYXQWIcfUfbQwVHw6sT-X-LP9EspDfXqNOQnm6QUcAN3d9HAxoEJ5kesDAP6W6EUQ6odygBf2Q2-wGIcEgisM6jeCizwsbd9roCE4EDfeK74dHdCooeQh3_eioZBLFJNPfGi8Cp4ke9oJ11DKdl5pNseP-GKgaT-tyieX9Uimavj73AayhR3msq3f9Dcw-BdgSJNRK5-7MQYX9T0wH_8',
      handle: 'zahra_ali'
    },
    icon: 'menu_book',
    likes: 134,
    dislikes: 3,
    commentsCount: 12,
    userVote: 'up',
    showComments: false,
    comments: [],
    tags: ['Swahili', 'Folklore']
  }
];

const PeopleToFollowScreen: React.FC<Props> = ({ navigate, goBack, onViewProfile, initialFilter }) => {
  const isSelectContactMode = initialFilter === 'SelectContact';

  const [activeTab, setActiveTab] = useState<'Suggestions' | 'Watu Helped' | 'Watu Posts'>(
    !isSelectContactMode && initialFilter === 'Helped' ? 'Watu Helped' : 'Suggestions'
  );

  const [people, setPeople] = useState<Person[]>(MOCK_PEOPLE);
  const [helpedPeople, setHelpedPeople] = useState<Person[]>(HELPED_PEOPLE);
  const [watuPosts, setWatuPosts] = useState<ContributionItem[]>(WATU_POSTS_DATA);

  // Watu Posts Filters
  const [watuTypeFilter, setWatuTypeFilter] = useState('All');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const typeFilterRef = useRef<HTMLDivElement>(null);

  // Scroll Header Logic
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const scrollY = useRef(0);
  const mainRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Get active list for filters
  const getActiveList = () => (activeTab === 'Suggestions' || isSelectContactMode) ? people : helpedPeople;

  // Use custom hooks
  const filters = useWatuFilters(getActiveList());
  const comments = useComments(watuPosts, setWatuPosts);

  // Measure Header Height when layout changes
  useEffect(() => {
    if (headerRef.current) {
      setTimeout(() => {
        if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
      }, 50);
    }
  }, [activeTab, isSelectContactMode, watuTypeFilter, filters.isSearchVisible]);

  // Scroll Handler
  const handleScroll = () => {
    if (!mainRef.current) return;
    const currentScrollY = mainRef.current.scrollTop;
    const diff = currentScrollY - scrollY.current;

    if (currentScrollY < 0) return;

    if (diff > 10 && currentScrollY > 50) {
      setIsHeaderVisible(false);
    } else if (diff < -10) {
      setIsHeaderVisible(true);
    }

    scrollY.current = currentScrollY;
  };

  // Click outside to close filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeFilterRef.current && !typeFilterRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isSelectContactMode && initialFilter === 'Helped') {
      setActiveTab('Watu Helped');
    }
  }, [initialFilter, isSelectContactMode]);

  const toggleFollow = (id: string) => {
    if (activeTab === 'Suggestions' || isSelectContactMode) {
      setPeople(prev => prev.map(p => p.id === id ? { ...p, isFollowing: !p.isFollowing } : p));
    } else {
      setHelpedPeople(prev => prev.map(p => p.id === id ? { ...p, isFollowing: !p.isFollowing } : p));
    }
  };

  const handleUserClick = (person: Person) => {
    if (isSelectContactMode) {
      navigate(Screen.DIRECT_MESSAGE, {
        chatUser: {
          name: person.name,
          avatar: person.avatar,
          isOnline: false
        }
      });
    } else {
      onViewProfile({
        name: person.name,
        handle: person.handle,
        avatar: person.avatar,
        isGuest: false
      });
    }
  };

  const handleNavigate = (item: ContributionItem) => {
    if (item.type === 'Story') navigate(Screen.STORY_DETAIL);
    if (item.type === 'Word') navigate(Screen.WORD_DETAIL);
    if (item.type === 'Proverb') navigate(Screen.PROVERB_DETAIL);
  };

  const filteredPosts = watuPosts.filter(post => watuTypeFilter === 'All' || post.type === watuTypeFilter);

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark text-stone-900 dark:text-white transition-colors duration-300 relative">
      {/* Scrollable Header Container */}
      <div
        ref={headerRef}
        className="absolute top-0 left-0 right-0 z-20 transition-all duration-300 ease-in-out bg-white dark:bg-background-dark shadow-sm border-b border-stone-200 dark:border-white/5"
        style={{ marginTop: isHeaderVisible ? 0 : -headerHeight }}
      >
        <WatuHeader
          isSelectContactMode={isSelectContactMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          peopleCount={people.length}
          isSearchVisible={filters.isSearchVisible}
          setIsSearchVisible={filters.setIsSearchVisible}
          searchQuery={filters.searchQuery}
          setSearchQuery={filters.setSearchQuery}
          goBack={goBack}
        />

        {/* Filter/Search Bar Container */}
        <div className="bg-background-light dark:bg-background-dark pb-2 transition-colors">
          {/* Watu Posts Filter Dropdown */}
          {activeTab === 'Watu Posts' && !isSelectContactMode && (
            <div className="px-4 py-2 relative z-20" ref={typeFilterRef}>
              <button
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${watuTypeFilter !== 'All'
                  ? 'bg-primary text-white ring-2 ring-primary ring-offset-2 ring-offset-stone-50 dark:ring-offset-background-dark'
                  : 'bg-white dark:bg-surface-dark text-stone-700 dark:text-text-muted border border-stone-200 dark:border-white/5 hover:bg-stone-50 dark:hover:bg-white/5'
                  }`}
                aria-label="Filter posts by type"
              >
                <Filter className="w-5 h-5" />
                <span>{watuTypeFilter === 'All' ? 'Filter Posts' : watuTypeFilter}</span>
                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFilterDropdownOpen && (
                <div className="absolute left-4 top-full mt-2 w-48 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-stone-200 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {['All', 'Story', 'Word', 'Proverb'].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setWatuTypeFilter(type);
                        setIsFilterDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors border-b border-stone-100 dark:border-white/5 last:border-0 ${watuTypeFilter === type
                        ? 'bg-primary/5 text-primary font-bold'
                        : 'text-stone-700 dark:text-text-main'
                        }`}
                    >
                      <span>{type === 'All' ? 'All Types' : type}</span>
                      {watuTypeFilter === type && <Check className="w-5 h-5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Filters only if NOT in SelectContact mode and NOT in Watu Posts tab */}
          {!isSelectContactMode && activeTab !== 'Watu Posts' && (
            <WatuFilters
              selectedRegion={filters.selectedRegion}
              setSelectedRegion={filters.setSelectedRegion}
              selectedLanguage={filters.selectedLanguage}
              setSelectedLanguage={filters.setSelectedLanguage}
              selectedRole={filters.selectedRole}
              setSelectedRole={filters.setSelectedRole}
              selectedActivity={filters.selectedActivity}
              setSelectedActivity={filters.setSelectedActivity}
              sortBy={filters.sortBy}
              setSortBy={filters.setSortBy}
              availableLanguages={filters.availableLanguages}
              activeFilterCount={filters.activeFilterCount}
              clearAllFilters={filters.clearAllFilters}
            />
          )}

          {isSelectContactMode && (
            <div className="px-4 py-2 font-bold text-sm text-stone-600 dark:text-text-muted bg-background-light dark:bg-background-dark">
              Contacts on Samiati
            </div>
          )}
        </div>
      </div>

      <main
        ref={mainRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto ${isSelectContactMode || activeTab === 'Watu Posts' ? 'p-4 space-y-4' : 'p-4 space-y-4'}`}
        style={{ paddingTop: headerHeight + 16 }}
      >

        {/* Select Contact Options (WhatsApp Style) */}
        {isSelectContactMode && (
          <div className="bg-white dark:bg-surface-dark py-2 mb-4 rounded-xl shadow-sm border border-stone-100 dark:border-white/5">
            <button
              onClick={() => navigate(Screen.NEW_GROUP)}
              className="w-full px-4 py-3 flex items-center gap-4 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors"
              aria-label="Create new group"
            >
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                <Users className="w-6 h-6" />
              </div>
              <span className="font-bold text-stone-900 dark:text-white">New group</span>
            </button>
            <button
              onClick={() => navigate(Screen.NEW_CONTACT)}
              className="w-full px-4 py-3 flex items-center gap-4 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors"
              aria-label="Add new contact"
            >
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                <UserPlus className="w-6 h-6" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-bold text-stone-900 dark:text-white">New contact</span>
                <span className="text-xs text-stone-500 dark:text-text-muted"><QrCode className="w-3 h-3 align-middle mr-1 inline" />Scan QR code</span>
              </div>
            </button>
            <button
              onClick={() => navigate(Screen.NEW_COMMUNITY)}
              className="w-full px-4 py-3 flex items-center gap-4 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors"
              aria-label="Create new community"
            >
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                <Users className="w-6 h-6" />
              </div>
              <span className="font-bold text-stone-900 dark:text-white">New community</span>
            </button>
          </div>
        )}

        {/* Watu Posts Content */}
        {activeTab === 'Watu Posts' && (
          <div className="space-y-4">
            {filteredPosts.map(item => (
              <WatuPostCard
                key={item.id}
                item={item}
                currentUserAvatar={CURRENT_USER_AVATAR}
                inputText={comments.inputTexts[item.id] || ''}
                replyTexts={comments.replyTexts}
                onNavigate={handleNavigate}
                onVote={comments.handleVote}
                onToggleComments={comments.toggleComments}
                onInputChange={(text) => comments.setInputTexts(prev => ({ ...prev, [item.id]: text }))}
                onReplyTextChange={(commentId, text) => comments.setReplyTexts(prev => ({ ...prev, [commentId]: text }))}
                onAddComment={() => comments.addComment(item.id)}
                onAddReply={(contributionId, parentId) => comments.addReply(contributionId, parentId)}
                onCommentVote={(e, commentId, voteType) => comments.handleCommentVote(e, item.id, commentId, voteType)}
                onToggleReply={(e, commentId) => comments.toggleReplyInput(e, item.id, commentId)}
                onViewProfile={onViewProfile}
              />
            ))}

            {filteredPosts.length === 0 && (
              <WatuEmptyState type="no-posts" />
            )}
          </div>
        )}

        {/* Suggestions & Helped Content */}
        {(activeTab === 'Suggestions' || activeTab === 'Watu Helped') && filters.filteredPeople.length === 0 && !isSelectContactMode && (
          <WatuEmptyState
            type="no-results"
            searchQuery={filters.searchQuery}
            onClearFilters={filters.activeFilterCount > 0 ? filters.clearAllFilters : undefined}
          />
        )}

        {(activeTab === 'Suggestions' || activeTab === 'Watu Helped' || isSelectContactMode) && filters.filteredPeople.map(person => (
          <WatuUserCard
            key={person.id}
            person={person}
            isSelectContactMode={isSelectContactMode}
            onUserClick={handleUserClick}
            onToggleFollow={toggleFollow}
            showMutualConnections={!isSelectContactMode}
          />
        ))}

        {isSelectContactMode && (
          <>
            <div className="px-4 py-4 text-xs font-bold text-stone-500 dark:text-text-muted">
              Invite to Samiati
            </div>
            <div className="px-4 py-3 flex items-center gap-4 opacity-50">
              <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-white/10 flex items-center justify-center text-stone-500 dark:text-text-muted">
                <Share2 className="w-6 h-6" />
              </div>
              <span className="font-bold text-stone-900 dark:text-white">Share invite link</span>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default PeopleToFollowScreen;

