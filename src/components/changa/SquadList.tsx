
import React from 'react';
import { ChallengeRole } from '@/types';

interface Props {
    roles: ChallengeRole[];
    onInvite?: () => void;
}

export const SquadList: React.FC<Props> = ({ roles, onInvite }) => {
    // Mock data augmentation for visuals as roles only has ID
    const leads = roles.filter(r => r.role === 'LEAD');
    const contributors = roles.filter(r => r.role === 'CONTRIBUTOR');

    return (
        <div className="bg-white dark:bg-[#42342b] border border-stone-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-stone-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#cf6317]">groups</span>
                    The Squad
                </h3>
                <button
                    onClick={onInvite}
                    className="text-xs font-bold text-[#cf6317] hover:underline"
                >
                    + Invite Friends
                </button>
            </div>

            <div className="space-y-6">
                {/* Team Leads */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Team Leads</h4>
                    <div className="flex flex-wrap gap-3">
                        {leads.map((lead, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-stone-100 dark:bg-black/20 pr-4 rounded-full border border-stone-200 dark:border-white/5">
                                <div className="w-8 h-8 rounded-full bg-stone-300 flex items-center justify-center overflow-hidden">
                                    {/* Placeholder for avatar since we only have ID currently */}
                                    <span className="text-xs font-bold text-stone-600">{lead.userId.substring(0, 2)}</span>
                                </div>
                                <span className="text-sm font-bold text-stone-700 dark:text-stone-300">@{lead.userId}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contributors */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Active Contributors</h4>
                    <div className="flex -space-x-3 overflow-hidden p-1">
                        {contributors.map((c, idx) => (
                            <div key={idx} className="w-10 h-10 rounded-full bg-stone-200 border-2 border-white dark:border-[#42342b] flex items-center justify-center relative z-10 hover:scale-110 transition-transform">
                                <span className="text-[10px] font-bold text-stone-500">{c.userId.substring(0, 1)}</span>
                            </div>
                        ))}
                        <button
                            onClick={onInvite}
                            className="w-10 h-10 rounded-full bg-stone-100 dark:bg-white/5 border-2 border-dashed border-stone-300 dark:border-white/20 flex items-center justify-center text-stone-400 hover:text-[#cf6317] hover:border-[#cf6317] transition-colors relative z-0"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
