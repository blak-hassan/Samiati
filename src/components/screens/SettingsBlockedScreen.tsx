
import React, { useState } from 'react';

interface Props {
  goBack: () => void;
}

const SettingsBlockedScreen: React.FC<Props> = ({ goBack }) => {
  const [blockedUsers, setBlockedUsers] = useState([
    { id: '1', name: 'Spam Bot 3000', handle: '@spam_king', avatar: 'https://i.pravatar.cc/150?u=spam' },
    { id: '2', name: 'Troll Account', handle: '@troll_123', avatar: 'https://i.pravatar.cc/150?u=troll' },
  ]);

  const handleUnblock = (id: string) => {
    setBlockedUsers(blockedUsers.filter(user => user.id !== id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 dark:bg-background-dark transition-colors duration-300">
      <header className="flex items-center p-4 sticky top-0 bg-stone-50 dark:bg-background-dark z-10 border-b border-stone-200 dark:border-white/5">
        <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-stone-900 dark:text-white ml-2">Blocked Accounts</h1>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {blockedUsers.length > 0 ? (
          blockedUsers.map(user => (
            <div key={user.id} className="flex items-center justify-between bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-stone-200 dark:border-white/5">
              <div className="flex items-center gap-3">
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-stone-200" />
                <div>
                  <p className="font-bold text-stone-900 dark:text-white text-sm">{user.name}</p>
                  <p className="text-xs text-stone-500 dark:text-text-muted">{user.handle}</p>
                </div>
              </div>
              <button 
                onClick={() => handleUnblock(user.id)}
                className="px-3 py-1.5 bg-stone-100 dark:bg-white/10 hover:bg-stone-200 dark:hover:bg-white/20 text-stone-900 dark:text-white text-xs font-bold rounded-lg transition-colors"
              >
                Unblock
              </button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-stone-500 dark:text-text-muted">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">block</span>
            <p>You haven't blocked anyone yet.</p>
          </div>
        )}
        <p className="text-xs text-stone-500 dark:text-text-muted px-2">
            Blocked accounts will not be able to see your profile, posts, or message you. They will not be notified that you blocked them.
        </p>
      </main>
    </div>
  );
};

export default SettingsBlockedScreen;
