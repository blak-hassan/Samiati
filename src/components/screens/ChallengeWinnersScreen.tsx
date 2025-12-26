
import React from 'react';
import { Screen, User } from '@/types';

interface Props {
    navigate: (screen: Screen) => void;
    goBack: () => void;
    onViewProfile: (user: User) => void;
}

const ChallengeWinnersScreen: React.FC<Props> = ({ navigate, goBack, onViewProfile }) => {
    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-stone-900 dark:text-white transition-colors duration-300">
            <header className="flex items-center p-4 sticky top-0 bg-background-light dark:bg-background-dark z-20 transition-colors border-b border-black/5 dark:border-white/5">
                <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="flex-1 text-center text-lg font-bold pr-8">Challenge Results</h1>
            </header>

            <main className="flex-1 p-4 pb-24 space-y-6">
                {/* Header Info */}
                <div className="text-center space-y-2">
                    <div className="w-20 h-20 mx-auto rounded-xl bg-cover bg-center shadow-lg" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBx_eI9l6bu70TPq5CaEAd_-ULg8fhcok3bgEKwNrl8k8g8msNhuh0eqAtvcZ49bYQH7TE57WsJ8nEjnHvFrrPsd3ahflQVyKODn-_hgs_HEsr2TMmHr6yXtWBr5VNgQmXODYmjDjA9nRvc_5gQdQHdzh9av2ArELYVLnNkdIPCE0X8DtZ51_6s3QFY-CSDLEFNriprnMhAuuG4Q0bI_M_UfKGxdlDaiNEJI1PcqeM9ah8MCndAARgCYdgBjtmmxoa9LZy3b2J2njY')` }}></div>
                    <h2 className="text-2xl font-bold">Folklore Friday</h2>
                    <p className="text-stone-500 dark:text-text-muted">The Trickster Tales • Ended Dec 17, 2023</p>
                    <div className="inline-block px-3 py-1 bg-stone-200 dark:bg-white/10 rounded-full text-xs font-bold text-stone-600 dark:text-text-muted uppercase tracking-wide">
                        Completed
                    </div>
                </div>

                {/* Podium */}
                <div className="flex justify-center items-end gap-4 py-6 relative">
                    {/* 2nd Place */}
                    <div className="flex flex-col items-center gap-2">
                        <img
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuGLE0i9NWNJMGLNeeS7Y-fkwpi4GavU-5tFQGjerfZBUK9A2baVE6a0v9b6Le6AIX-Xejh_WCf4Bb8tk8yqNXUeyVehi927mNkXbnvMb3ggvQTzfMzZcJc0kPiyaqMcPlts57mpPxJLq5-lgGwTjXzXNGyasv8_llUjyNVB2m-dLngZv8en8HyHDdbU1j_Wt2xl1HDaHg_iKgKX7HviRx7y_sXmAmU_NNuzZlrcnkbqtGL8NTvNgBOFaC4sSZ5yd97zBiTylIkog"
                            alt="Chike"
                            onClick={() => onViewProfile({ name: 'Chike', handle: 'chike', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuGLE0i9NWNJMGLNeeS7Y-fkwpi4GavU-5tFQGjerfZBUK9A2baVE6a0v9b6Le6AIX-Xejh_WCf4Bb8tk8yqNXUeyVehi927mNkXbnvMb3ggvQTzfMzZcJc0kPiyaqMcPlts57mpPxJLq5-lgGwTjXzXNGyasv8_llUjyNVB2m-dLngZv8en8HyHDdbU1j_Wt2xl1HDaHg_iKgKX7HviRx7y_sXmAmU_NNuzZlrcnkbqtGL8NTvNgBOFaC4sSZ5yd97zBiTylIkog', isGuest: false })}
                            className="w-12 h-12 rounded-full border-2 border-stone-300 object-cover cursor-pointer"
                        />
                        <div className="flex flex-col items-center">
                            <p className="text-xs font-bold text-stone-600 dark:text-text-muted">Chike</p>
                            <div className="w-16 h-24 bg-gradient-to-t from-stone-400 to-stone-300 rounded-t-lg flex items-center justify-center text-white font-bold text-xl shadow-lg relative">
                                2
                            </div>
                        </div>
                    </div>

                    {/* 1st Place */}
                    <div className="flex flex-col items-center gap-2 -mb-2 z-10">
                        <div className="relative">
                            <span className="material-symbols-outlined text-yellow-400 text-3xl absolute -top-6 left-1/2 -translate-x-1/2 drop-shadow-sm">crown</span>
                            <img
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHGQCh7G1VnjuVj9331GPw-eizTILg3UcwDA4ENWzw4Y4k-YeCgWzwUxAmYXQWIcfUfbQwVHw6sT-X-LP9EspDfXqNOQnm6QUcAN3d9HAxoEJ5kesDAP6W6EUQ6odygBf2Q2-wGIcEgisM6jeCizwsbd9roCE4EDfeK74dHdCooeQh3_eioZBLFJNPfGi8Cp4ke9oJ11DKdl5pNseP-GKgaT-tyieX9Uimavj73AayhR3msq3f9Dcw-BdgSJNRK5-7MQYX9T0wH_8"
                                alt="Amina"
                                onClick={() => onViewProfile({ name: 'Amina', handle: 'amina', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHGQCh7G1VnjuVj9331GPw-eizTILg3UcwDA4ENWzw4Y4k-YeCgWzwUxAmYXQWIcfUfbQwVHw6sT-X-LP9EspDfXqNOQnm6QUcAN3d9HAxoEJ5kesDAP6W6EUQ6odygBf2Q2-wGIcEgisM6jeCizwsbd9roCE4EDfeK74dHdCooeQh3_eioZBLFJNPfGi8Cp4ke9oJ11DKdl5pNseP-GKgaT-tyieX9Uimavj73AayhR3msq3f9Dcw-BdgSJNRK5-7MQYX9T0wH_8', isGuest: false })}
                                className="w-16 h-16 rounded-full border-2 border-yellow-400 object-cover shadow-lg cursor-pointer"
                            />
                        </div>
                        <div className="flex flex-col items-center">
                            <p className="text-sm font-bold text-primary dark:text-white">Amina</p>
                            <div className="w-20 h-32 bg-gradient-to-t from-rasta-gold to-amber-400 rounded-t-lg flex items-center justify-center text-white font-bold text-3xl shadow-xl">
                                1
                            </div>
                        </div>
                    </div>

                    {/* 3rd Place */}
                    <div className="flex flex-col items-center gap-2">
                        <img
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA33dgvI_8O1U2ZsGRRdIrN6msDVHDnzcOdKb2aEXmYC6BfYJvld3snbK7MQxEUsWkCLK5m9ry75kxZt9sfUj6Lj3S1keqVySoqqDOIddmUfbhh1NdpYKeiNphTGsh0op0pjtMhHziNPcUnCoOwh0BNylf0gclux6S7K-7-UHrGrvKE0tNqLQdIZ2zsi9R4Op0Mw2iKcHKarDj1ikZRS8LF2G1DNUTepgcMC76cBhfsNp4cHQ24AUuqP1KmseLie5Uq-O-YHLOwnM8"
                            alt="Fatou"
                            onClick={() => onViewProfile({ name: 'Fatou', handle: 'fatou', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA33dgvI_8O1U2ZsGRRdIrN6msDVHDnzcOdKb2aEXmYC6BfYJvld3snbK7MQxEUsWkCLK5m9ry75kxZt9sfUj6Lj3S1keqVySoqqDOIddmUfbhh1NdpYKeiNphTGsh0op0pjtMhHziNPcUnCoOwh0BNylf0gclux6S7K-7-UHrGrvKE0tNqLQdIZ2zsi9R4Op0Mw2iKcHKarDj1ikZRS8LF2G1DNUTepgcMC76cBhfsNp4cHQ24AUuqP1KmseLie5Uq-O-YHLOwnM8', isGuest: false })}
                            className="w-12 h-12 rounded-full border-2 border-amber-700 object-cover cursor-pointer"
                        />
                        <div className="flex flex-col items-center">
                            <p className="text-xs font-bold text-stone-600 dark:text-text-muted">Fatou</p>
                            <div className="w-16 h-16 bg-gradient-to-t from-orange-700 to-amber-600 rounded-t-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                3
                            </div>
                        </div>
                    </div>
                </div>

                {/* My Stats */}
                <div className="bg-primary/10 dark:bg-primary/20 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-primary dark:text-primary">Your Result</p>
                        <p className="text-stone-900 dark:text-white">You didn't participate in this challenge.</p>
                    </div>
                    <span className="material-symbols-outlined text-3xl text-primary/50">sentiment_dissatisfied</span>
                </div>

                {/* Winner List */}
                <div>
                    <h3 className="font-bold text-lg mb-3">Top Stories</h3>
                    <div className="space-y-3">
                        {[
                            { rank: 1, title: "The Spider's Web", author: "Amina Diallo", likes: 234, handle: 'amina' },
                            { rank: 2, title: "Why the Tortoise has a cracked shell", author: "Chike Okoro", likes: 198, handle: 'chike' },
                            { rank: 3, title: "The Moon and the Sun", author: "Fatou Sow", likes: 156, handle: 'fatou' },
                            { rank: 4, title: "Anansi goes fishing", author: "Kwame", likes: 120, handle: 'kwame' },
                            { rank: 5, title: "The Lion's Gift", author: "Zahra", likes: 98, handle: 'zahra' },
                        ].map((story) => (
                            <div
                                key={story.rank}
                                className="bg-white dark:bg-surface-dark border border-stone-200 dark:border-white/5 rounded-xl p-4 flex items-center gap-4 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors active:scale-[0.98]"
                            >
                                <span className={`w-8 font-bold text-center text-lg ${story.rank <= 3 ? 'text-primary' : 'text-stone-400'}`}>#{story.rank}</span>
                                <div className="flex-1 cursor-pointer" onClick={() => navigate(Screen.STORY_DETAIL)}>
                                    <h4 className="font-bold text-stone-900 dark:text-white">{story.title}</h4>
                                    <p
                                        className="text-sm text-stone-500 dark:text-text-muted hover:text-primary transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewProfile({
                                                name: story.author,
                                                handle: story.handle,
                                                avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeLXbWz4AzkUBDUb3vYkhuHrvvC9EFxb7YuDTFXSRV6e6T547HBjftD2_M3MWQ23u8DdygDU3-kcrmReHHcg1xuI2vz_fBK_UAfIaTV6tCpEh1xW7vkPs6qjbSwVjkqUkPXcPuBDRL_I0E_dA3ckyiMN2POsZ3M2E57RwaQqNiSED1NzWUTMmbbesb_Ko-z2BYoXtkkWP0lVOyL0aKlkzlpsNevnW1dPGKRZ5SxqpNtu6pvvjeFLtIUcElhd54x2R98mDwi_k8K4w', // Placeholder
                                                isGuest: false
                                            });
                                        }}
                                    >
                                        by {story.author}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 text-stone-500 dark:text-text-muted">
                                    <span className="material-symbols-outlined text-sm">favorite</span>
                                    <span className="text-sm font-medium">{story.likes}</span>
                                </div>
                                <span className="material-symbols-outlined text-stone-300 dark:text-white/20">chevron_right</span>
                            </div>
                        ))}
                    </div>
                </div>

                <button className="w-full py-4 text-center font-bold text-primary hover:text-primary-hover">
                    View Full Leaderboard
                </button>
            </main>
        </div>
    );
};

export default ChallengeWinnersScreen;
