
import React, { useState, useRef } from 'react';
import { Screen, ChatPreview } from '@/types';

interface Props {
  navigate: (screen: Screen, params?: any) => void;
  goBack: () => void;
  onCreateGroup?: (group: ChatPreview) => void;
}

const NewGroupScreen: React.FC<Props> = ({ navigate, goBack, onCreateGroup }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showNameError, setShowNameError] = useState(false);
  
  // Settings State
  const [disappearingMessages, setDisappearingMessages] = useState<'Off' | '24 Hours' | '7 Days' | '90 Days'>('Off');
  const [permissions, setPermissions] = useState<'Default' | 'Admins Only'>('Default');

  const nameInputRef = useRef<HTMLInputElement>(null);

  const MOCK_CONTACTS = [
    { id: '1', name: 'Kwame Mensah', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuGLE0i9NWNJMGLNeeS7Y-fkwpi4GavU-5tFQGjerfZBUK9A2baVE6a0v9b6Le6AIX-Xejh_WCf4Bb8tk8yqNXUeyVehi927mNkXbnvMb3ggvQTzfMzZcJc0kPiyaqMcPlts57mpPxJLq5-lgGwTjXzXNGyasv8_llUjyNVB2m-dLngZv8en8HyHDdbU1j_Wt2xl1HDaHg_iKgKX7HviRx7y_sXmAmU_NNuzZlrcnkbqtGL8NTvNgBOFaC4sSZ5yd97zBiTylIkog' },
    { id: '2', name: 'Zahra Ali', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHGQCh7G1VnjuVj9331GPw-eizTILg3UcwDA4ENWzw4Y4k-YeCgWzwUxAmYXQWIcfUfbQwVHw6sT-X-LP9EspDfXqNOQnm6QUcAN3d9HAxoEJ5kesDAP6W6EUQ6odygBf2Q2-wGIcEgisM6jeCizwsbd9roCE4EDfeK74dHdCooeQh3_eioZBLFJNPfGi8Cp4ke9oJ11DKdl5pNseP-GKgaT-tyieX9Uimavj73AayhR3msq3f9Dcw-BdgSJNRK5-7MQYX9T0wH_8' },
    { id: '3', name: 'Chike Okoro', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCf35EoI1LYG_Z-DVruXrhf48EMhNAfhAbaIoN6aNxIOA7VWp8i9i-bmGhJmE0dqxwKZOscNOyTdZhqM8oDoilkrWcTxcmgWw_9TKUo8f2ASQEfAbbjXAelehx2KYPAN8W1qBGBDnvXJmTlMbdPIdPtbLjIMEeo6jhXcD7OkpFeAa7ECkhmLX-DoyYLYn3mUQ7yRcrIkO3DdTcFC-tZ0hxx31yGdTsr7k-44mC1gpIEDYR6Jk63r6sc1JtxESZ_z8CzlfVQD_p38c' },
    { id: '4', name: 'Fatou Sow', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA33dgvI_8O1U2ZsGRRdIrN6msDVHDnzcOdKb2aEXmYC6BfYJvld3snbK7MQxEUsWkCLK5m9ry75kxZt9sfUj6Lj3S1keqVySoqqDOIddmUfbhh1NdpYKeiNphTGsh0op0pjtMhHziNPcUnCoOwh0BNylf0gclux6S7K-7-UHrGrvKE0tNqLQdIZ2zsi9R4Op0Mw2iKcHKarDj1ikZRS8LF2G1DNUTepgcMC76cBhfsNp4cHQ24AUuqP1KmseLie5Uq-O-YHLOwnM8' },
    { id: '5', name: 'Thabo Mokoena', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6LZtwoRZLVf_mfFqdY11OX1RDMuLNBfzg-1-JqIap60sqItIczvKLkOwTmDA2J4pvgnJj5aFZAOk2PIeB-aYBeYRowNGFP8T6NhD2DXsMXeufNtSm-w5qmkobZjLTsvLwAACWIfN9watEHLy7hX6MckJh3IpQmn_5d1cs77_r6spZ27YrpgTvwW_gUlkhejzZ15PFd6Wav0M6iz-05tnZhk6UZkd-dSx3hIpX_jHEGKs4ob8uyhELqdeumxAYPV-uJ49KGz0AbDw' },
    { id: '6', name: 'Nala Bekele', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwIbRrqJ4ZJ8GZcDvg3A8ICBI_glwNU2kT-sFW7-8qY1XYmEp5OPUPcOp1LTcTEL-9WOzc1bMxyURmWkWyrBOe5qFmcJy1VwLlI3U2fRprY3C452LNhCV5ucydy-MWIfij3s9wB7Womu3RmxEVpEBd6YW7i0ty-O2kqgzw4oYkynhtJWwuEqnWs0dyjiruGe25Bcsxd76N3hCs8K0KoGsEYyeM8qS63xvzlpMaTz-GZK-kI1D7zM4blUhv-JzuvkPJODszYC07wbc' }
  ];

  const toggleContact = (id: string) => {
    const newSet = new Set(selectedContacts);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedContacts(newSet);
    
    // Clear search if we just added someone to make it easier to add more
    if (!newSet.has(id)) {
        // removed
    } else if (searchQuery.length > 0) {
        setSearchQuery('');
    }
  };

  const handleCreate = () => {
    if (selectedContacts.size === 0) return;

    if (!groupName.trim()) {
        setShowNameError(true);
        if (nameInputRef.current) {
            nameInputRef.current.focus();
        }
        // Shake animation reset
        setTimeout(() => setShowNameError(false), 500);
        return;
    }

    if (onCreateGroup) {
      const newGroup: ChatPreview = {
        id: `group-${Date.now()}`,
        name: groupName,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6LZtwoRZLVf_mfFqdY11OX1RDMuLNBfzg-1-JqIap60sqItIczvKLkOwTmDA2J4pvgnJj5aFZAOk2PIeB-aYBeYRowNGFP8T6NhD2DXsMXeufNtSm-w5qmkobZjLTsvLwAACWIfN9watEHLy7hX6MckJh3IpQmn_5d1cs77_r6spZ27YrpgTvwW_gUlkhejzZ15PFd6Wav0M6iz-05tnZhk6UZkd-dSx3hIpX_jHEGKs4ob8uyhELqdeumxAYPV-uJ49KGz0AbDw', // Default group icon
        lastMessage: 'Group created',
        time: 'Just now',
        unreadCount: 0,
        isOnline: false,
        isGroup: true
      };
      onCreateGroup(newGroup);
    }

    navigate(Screen.MESSAGES);
  };

  const cycleDisappearingMessages = () => {
    const options: ('Off' | '24 Hours' | '7 Days' | '90 Days')[] = ['Off', '24 Hours', '7 Days', '90 Days'];
    const currentIndex = options.indexOf(disappearingMessages);
    setDisappearingMessages(options[(currentIndex + 1) % options.length]);
  };

  const togglePermissions = () => {
    setPermissions(prev => prev === 'Default' ? 'Admins Only' : 'Default');
  };

  const filteredContacts = MOCK_CONTACTS.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedList = MOCK_CONTACTS.filter(c => selectedContacts.has(c.id));
  const isValid = groupName.trim().length > 0 && selectedContacts.size > 0;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-background-dark transition-colors duration-300">
      <header className="flex items-center p-4 bg-background-light dark:bg-surface-dark border-b border-stone-200 dark:border-white/5 sticky top-0 z-10 transition-colors shrink-0">
        <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1 ml-2">
          <h1 className="text-xl font-bold text-stone-900 dark:text-white">New group</h1>
          <p className="text-xs text-stone-500 dark:text-text-muted">Add subject and participants</p>
        </div>
        {/* Create Text Button (Alternative to FAB) */}
        <button 
            onClick={handleCreate} 
            disabled={!isValid}
            className={`font-bold px-2 transition-colors ${isValid ? 'text-primary dark:text-primary' : 'text-stone-400 dark:text-white/30 cursor-not-allowed'}`}
        >
            Create
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {/* Top Section: Icon & Subject */}
        <div className="p-6 bg-stone-50 dark:bg-white/5 flex flex-col items-center gap-6 transition-colors">
            <div className="flex gap-4 items-center w-full">
                <button className="w-16 h-16 bg-stone-200 dark:bg-white/10 rounded-full flex items-center justify-center text-stone-400 dark:text-text-muted hover:bg-stone-300 dark:hover:bg-white/20 transition-colors relative group shrink-0">
                    <span className="material-symbols-outlined text-3xl">camera_alt</span>
                    <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-white font-bold uppercase">Edit</span>
                    </div>
                </button>
                <div className="flex-1 relative">
                    <input 
                        ref={nameInputRef}
                        type="text" 
                        placeholder="Group Subject (Required)" 
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className={`w-full bg-transparent border-b-2 py-2 pr-8 text-stone-900 dark:text-white outline-none placeholder-stone-400 dark:placeholder-text-muted transition-all ${showNameError ? 'border-error animate-shake' : 'border-stone-300 dark:border-white/20 focus:border-primary'}`}
                    />
                    <div className="absolute right-0 top-2 text-stone-400 dark:text-text-muted cursor-pointer hover:text-stone-600 dark:hover:text-white">
                        <span className="material-symbols-outlined">emoji_emotions</span>
                    </div>
                    <div className="text-right text-xs text-stone-400 dark:text-text-muted mt-1">
                        {25 - groupName.length}
                    </div>
                </div>
            </div>
            
            <div className="w-full space-y-4">
                <div 
                    onClick={cycleDisappearingMessages}
                    className="flex items-center justify-between py-2 border-t border-stone-200 dark:border-white/10 cursor-pointer group select-none"
                >
                    <div className="flex flex-col">
                        <span className="font-medium text-stone-900 dark:text-white">Disappearing Messages</span>
                        <span className="text-xs text-stone-500 dark:text-text-muted transition-colors group-hover:text-primary">{disappearingMessages}</span>
                    </div>
                    <span className="material-symbols-outlined text-stone-400 dark:text-text-muted group-hover:text-primary transition-colors">timer</span>
                </div>
                <div 
                    onClick={togglePermissions}
                    className="flex items-center justify-between py-2 border-t border-stone-200 dark:border-white/10 cursor-pointer group select-none"
                >
                    <div className="flex flex-col">
                        <span className="font-medium text-stone-900 dark:text-white">Group Permissions</span>
                        <span className="text-xs text-stone-500 dark:text-text-muted transition-colors group-hover:text-primary">{permissions}</span>
                    </div>
                    <span className="material-symbols-outlined text-stone-400 dark:text-text-muted group-hover:text-primary transition-colors">lock</span>
                </div>
            </div>
        </div>

        {/* Participants Header & Search */}
        <div className="sticky top-0 bg-white dark:bg-background-dark z-10 shadow-sm border-b border-stone-100 dark:border-white/5 transition-colors">
            <div className="px-4 py-3">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-500 text-sm">search</span>
                    <input 
                        type="text" 
                        placeholder="Search contacts..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-stone-100 dark:bg-white/10 rounded-lg py-2 pl-9 pr-8 text-sm text-stone-900 dark:text-white focus:outline-none placeholder-stone-500 transition-colors"
                    />
                    {searchQuery.length > 0 && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-2 text-stone-400 hover:text-stone-600 dark:hover:text-white"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    )}
                </div>
            </div>
            
            {/* Selected Contacts Horizontal List */}
            {selectedContacts.size > 0 && (
                <div className="px-4 pb-3 flex gap-4 overflow-x-auto no-scrollbar animate-in slide-in-from-top-2">
                    {selectedList.map(c => (
                        <div key={c.id} className="flex flex-col items-center gap-1 min-w-[60px] animate-in zoom-in duration-200">
                            <div className="relative">
                                <img src={c.avatar} alt={c.name} className="w-12 h-12 rounded-full object-cover" />
                                <button 
                                    onClick={() => toggleContact(c.id)}
                                    className="absolute bottom-0 right-0 bg-stone-500 text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-stone-700 transition-colors border border-white dark:border-background-dark"
                                >
                                    <span className="material-symbols-outlined text-[10px] font-bold">close</span>
                                </button>
                            </div>
                            <span className="text-[10px] text-stone-900 dark:text-white text-center truncate w-full">{c.name.split(' ')[0]}</span>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="px-4 py-2 bg-stone-100 dark:bg-black/20 text-xs font-bold text-stone-500 dark:text-text-muted uppercase">
                Contacts on Samiati ({filteredContacts.length})
            </div>
        </div>

        {/* Contact List */}
        <div className="divide-y divide-stone-100 dark:divide-white/5">
            {filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-stone-500 dark:text-text-muted">
                    No contacts found
                </div>
            ) : (
                filteredContacts.map(contact => (
                    <div 
                        key={contact.id} 
                        onClick={() => toggleContact(contact.id)}
                        className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors ${selectedContacts.has(contact.id) ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-stone-50 dark:hover:bg-white/5'}`}
                    >
                        <div className="relative">
                            <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
                            {selectedContacts.has(contact.id) && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary border-2 border-white dark:border-background-dark rounded-full flex items-center justify-center scale-90 animate-in zoom-in">
                                    <span className="material-symbols-outlined text-white text-[10px] font-bold">check</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className={`font-bold text-sm ${selectedContacts.has(contact.id) ? 'text-primary' : 'text-stone-900 dark:text-white'}`}>{contact.name}</h3>
                            <p className="text-xs text-stone-500 dark:text-text-muted truncate">Hey there! I am using Samiati.</p>
                        </div>
                    </div>
                ))
            )}
        </div>
      </main>

      {/* FAB - Always visible if contacts selected, visual feedback if name missing */}
      {selectedContacts.size > 0 && (
          <div className="fixed bottom-6 right-6 z-20">
            <button 
                onClick={handleCreate}
                className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 animate-in zoom-in ${
                    isValid 
                        ? 'bg-primary text-white hover:bg-primary-hover hover:scale-105 active:scale-95' 
                        : 'bg-stone-300 dark:bg-stone-700 text-stone-500 dark:text-stone-400 cursor-not-allowed'
                }`}
            >
                <span className="material-symbols-outlined text-2xl">check</span>
            </button>
          </div>
      )}
    </div>
  );
};

export default NewGroupScreen;
