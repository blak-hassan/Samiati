"use client";

import React, { useState, useEffect, useRef, memo } from 'react';
import { Screen } from '@/types';

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
}

interface Reply {
  id: string;
  author: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
  isLiked: boolean;
}

interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
  isLiked: boolean;
  replies: Reply[];
  isReplying: boolean; 
}

const CURRENT_USER_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuBeLXbWz4AzkUBDUb3vYkhuHrvvC9EFxb7YuDTFXSRV6e6T547HBjftD2_M3MWQ23u8DdygDU3-kcrmReHHcg1xuI2vz_fBK_UAfIaTV6tCpEh1xW7vkPs6qjbSwVjkqUkPXcPuBDRL_I0E_dA3ckyiMN2POsZ3M2E57RwaQqNiSED1NzWUTMmbbesb_Ko-z2BYoXtkkWP0lVOyL0aKlkzlpsNevnW1dPGKRZ5SxqpNtu6pvvjeFLtIUcElhd54x2R98mDwi_k8K4w";

const MOCK_COMMENTS_DATA: Comment[] = [
  { 
    id: '1', 
    author: 'Juma', 
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6LZtwoRZLVf_mfFqdY11OX1RDMuLNBfzg-1-JqIap60sqItIczvKLkOwTmDA2J4pvgnJj5aFZAOk2PIeB-aYBeYRowNGFP8T6NhD2DXsMXeufNtSm-w5qmkobZjLTsvLwAACWIfN9watEHLy7hX6MckJh3IpQmn_5d1cs77_r6spZ27YrpgTvwW_gUlkhejzZ15PFd6Wav0M6iz-05tnZhk6UZkd-dSx3hIpX_jHEGKs4ob8uyhELqdeumxAYPV-uJ49KGz0AbDw', 
    text: 'This is my favorite proverb! It teaches patience.', 
    time: '2h ago', 
    likes: 12,
    isLiked: false,
    replies: [],
    isReplying: false
  },
  { 
    id: '2', 
    author: 'Sarah', 
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHGQCh7G1VnjuVj9331GPw-eizTILg3UcwDA4ENWzw4Y4k-YeCgWzwUxAmYXQWIcfUfbQwVHw6sT-X-LP9EspDfXqNOQnm6QUcAN3d9HAxoEJ5kesDAP6W6EUQ6odygBf2Q2-wGIcEgisM6jeCizwsbd9roCE4EDfeK74dHdCooeQh3_eioZBLFJNPfGi8Cp4ke9oJ11DKdl5pNseP-GKgaT-tyieX9Uimavj73AayhR3msq3f9Dcw-BdgSJNRK5-7MQYX9T0wH_8', 
    text: 'My grandmother used to say this all the time when we were rushing to finish chores.', 
    time: '5h ago', 
    likes: 8,
    isLiked: false,
    replies: [
        {
            id: '2-1',
            author: 'Amina',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-V3E8jEaab6c5oqCwte8YO0FtTA-Q39LF02RVqSEIn-yFIxEXpqQNtov9YUVPsspoTd-G0IBX5eD3D1FcoYuaZ2D_obUh27Cgzr8TPZ-NFxlWutmC2r8AZ1IX4K6AJVN-WZkqrWzUYtGMn9bKxe6QkCpDd7wYm74pmBOZiwy9Z5UBxeeJs2ysKmBaR6jUiNoHpNBP7lzTP6QEx4IL-GexQtsOvMdHpFtTD_Mf778b0wdPEW-lb49hYodddCWGwok-y1Z7z_2zLgA',
            text: 'Same here! It is such a classic.',
            time: '1h ago',
            likes: 2,
            isLiked: false
        }
    ],
    isReplying: false
  }
];

const RELATED_CONTENT = [
    { 
        id: 'r1',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgGK4HiP_WY3pOD4a5vjGWGtQqUUhOEyj94mc4Il4W9cK7uPISoDqA2_rAz6yx1hMgSr8B5pR8Q6cUCf4E81l5Yo--0f2oCHKyYXaSMxJOQKq6tn9MI-Cjx-_4Er3rmI0A8aTcqHLHpt7l2rEFyWita0CSiwer0MhunOiGwr3xKNC0bD-0tv8nalLieXnnzrSwIA5w9S3Fmuvy2UtBjpw7MdkR-USmYOn1ZIjsdIHGV9bFOVr97G958mCv7m40Q8Pa3Wq6A3Td9dk', 
        title: "Ruwa ba sa'an kwando ba",
        type: "Proverb" 
    },
    { 
        id: 'r2',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBx_eI9l6bu70TPq5CaEAd_-ULg8fhcok3bgEKwNrl8k8g8msNhuh0eqAtvcZ49bYQH7TE57WsJ8nEjnHvFrrPsd3ahflQVyKODn-_hgs_HEsr2TMmHr6yXtWBr5VNgQmXODYmjDjA9nRvc_5gQdQHdzh9av2ArELYVLnNkdIPCE0X8DtZ51_6s3QFY-CSDLEFNriprnMhAuuG4Q0bI_M_UfKGxdlDaiNEJI1PcqeM9ah8MCndAARgCYdgBjtmmxoa9LZy3b2J2njY', 
        title: "Mai rai da kunya",
        type: "Proverb" 
    },
    {
        id: 'r3',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTCkmqfVuPlLQ4IRyL2yV9d82xXGhUn6PZJQuyR-wOR0cvIaU2RmXVEYxrDKRF8LwvPO8ui_vLey4StEqf8CTMHBir5NqJ8BI6X6gXKzW2e5jtCmaOROPdLEoAJCmmFm51ht9zq7QwPnSBQC8TAqlJfRa5M4kLarJ9LqR6i2YIFBkKl3YmSCiPo77SFPw336bJQN6weNdBrPdUlu-Ta6wtwbzNsRkfyTwRr05-OJF-2JEsH1EwbuwH-dLxzpESsJxfK0fBRGIneoQ',
        title: "The Lion's Gift",
        type: "Story"
    },
    {
        id: 'r4',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6LZtwoRZLVf_mfFqdY11OX1RDMuLNBfzg-1-JqIap60sqItIczvKLkOwTmDA2J4pvgnJj5aFZAOk2PIeB-aYBeYRowNGFP8T6NhD2DXsMXeufNtSm-w5qmkobZjLTsvLwAACWIfN9watEHLy7hX6MckJh3IpQmn_5d1cs77_r6spZ27YrpgTvwW_gUlkhejzZ15PFd6Wav0M6iz-05tnZhk6UZkd-dSx3hIpX_jHEGKs4ob8uyhELqdeumxAYPV-uJ49KGz0AbDw',
        title: "Haraka haraka haina baraka",
        type: "Proverb"
    },
    {
        id: 'r5',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4lz2n92fP-3f8sFkeqH_L_kJ7Q2AZ-rKVTVq2mHkBM03IcR48LuFc52l2n01S6qFNeWfcKfWiRGfDWXx7jltQFbz09EH7Jmydr-dedWx_HiMM9BpKt4Q-KGq3CwTb0q_yQEwiNpQK3YPa8Jc0yYElrtn0iiMkXVI_6ThJOtnJOGkzZ5LVghgn3cawRvuHQuHSu6qXCXFuc78ULoKqjHj55wHc9kHkNIrpnsanbDaYLZo0KNkg3XyohzwahpixxUaa1hKfRo-GVro',
        title: "Umoja",
        type: "Word"
    },
    {
        id: 'r6',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeLXbWz4AzkUBDUb3vYkhuHrvvC9EFxb7YuDTFXSRV6e6T547HBjftD2_M3MWQ23u8DdygDU3-kcrmReHHcg1xuI2vz_fBK_UAfIaTV6tCpEh1xW7vkPs6qjbSwVjkqUkPXcPuBDRL_I0E_dA3ckyiMN2POsZ3M2E57RwaQqNiSED1NzWUTMmbbesb_Ko-z2BYoXtkkWP0lVOyL0aKlkzlpsNevnW1dPGKRZ5SxqpNtu6pvvjeFLtIUcElhd54x2R98mDwi_k8K4w',
        title: "Ubuntu",
        type: "Word"
    },
    {
        id: 'r7',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCf35EoI1LYG_Z-DVruXrhf48EMhNAfhAbaIoN6aNxIOA7VWp8i9i-bmGhJmE0dqxwKZOscNOyTdZhqM8oDoilkrWcTxcmgWw_9TKUo8f2ASQEfAbbjXAelehx2KYPAN8W1qBGBDnvXJmTlMbdPIdPtbLjIMEeo6jhXcD7OkpFeAa7ECkhmLX-DoyYLYn3mUQ7yRcrIkO3DdTcFC-tZ0hxx31yGdTsr7k-44mC1gpIEDYR6Jk63r6sc1JtxESZ_z8CzlfVQD_p38c',
        title: "The Tortoise's Shell",
        type: "Story"
    },
    {
        id: 'r8',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwIbRrqJ4ZJ8GZcDvg3A8ICBI_glwNU2kT-sFW7-8qY1XYmEp5OPUPcOp1LTcTEL-9WOzc1bMxyURmWkWyrBOe5qFmcJy1VwLlI3U2fRprY3C452LNhCV5ucydy-MWIfij3s9wB7Womu3RmxEVpEBd6YW7i0ty-O2kqgzw4oYkynhtJWwuEqnWs0dyjiruGe25Bcsxd76N3hCs8K0KoGsEYyeM8qS63xvzlpMaTz-GZK-kI1D7zM4blUhv-JzuvkPJODszYC07wbc',
        title: "Asiyefunzwa na mamaye",
        type: "Proverb"
    },
    {
        id: 'r9',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOIwrsG4DdrbXTAYf-WXRBaHgcqmT14MY_lmYvUkyZtg0RT_-_dHr_napeF6KMniL8zX6d4_A3RDIuiWm9yAZgdZNsgMfxya3pNJsh4WtKmq86hGYPf6PsZ1APxyHvNxwo803VmKszYhTsb0nAz5-Pxy_PLCdxtBBnmNAa-aAkGgOXRGmz1mu-iKxyz51wJ0BR7y9Nre3kHGXsNisV4cm71L-A43Q2DUXEuzYtM8CFrV2G7RI6c3hfmOgx8Mv-pQQhgBITOcU8TIE',
        title: "Pole pole",
        type: "Word"
    },
    {
        id: 'r10',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVEz4UTCpp223l9QRsdxYGf4pegaKfIoxUYdvO2wPo8XCkY1wn0s7omDDuk5l9UfGHmSUMYiZUUiyeVrj5DHh5gKGghBS5J2alPWrLAd8VmA-CBLb7qbiOcvqYtIFuk8Iw9ZjCmIWsqxrq9lXoxaDfBKx3IEbV995TSPyPknJVXq7CE98Xs5Bc97lpSiqftZE4YnDIH4KY3CfDGILDtoz-44vJc1F-kNPQ3hBDDIXf21ifYT-byy_M-5rVvOpQ851C6YS0xkM3lcM',
        title: "Kuku Havunji Yai Lake",
        type: "Proverb"
    },
    {
        id: 'r11',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA33dgvI_8O1U2ZsGRRdIrN6msDVHDnzcOdKb2aEXmYC6BfYJvld3snbK7MQxEUsWkCLK5m9ry75kxZt9sfUj6Lj3S1keqVySoqqDOIddmUfbhh1NdpYKeiNphTGsh0op0pjtMhHziNPcUnCoOwh0BNylf0gclux6S7K-7-UHrGrvKE0tNqLQdIZ2zsi9R4Op0Mw2iKcHKarDj1ikZRS8LF2G1DNUTepgcMC76cBhfsNp4cHQ24AUuqP1KmseLie5Uq-O-YHLOwnM8',
        title: "The Singing Drum",
        type: "Story"
    },
    {
        id: 'r12',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKkfM9WqTPsqCfuM1KQIQ1QzsbiAaq2rab_EQ2MwL_8b9sbJ3-mIl3CjDCR888PPrsBNhkpl7tkden40rCqo3pJe3Sepe18k46KUvejTidyoAK941vcqejBnqRrcfC5hPZop_XFQ7S9jkteso1RvDSjv8s1JfGwGhOYE1uQ1M1J93quDxOniTqTNGD-1WZq2GOu_Z1EpzGjMzNeyvhYbuIwiqYK1TDLfGX5mpdg--_df6DoewiFO-RhrraeKpwY7MetQ94avb6spo',
        title: "Hakuna Matata",
        type: "Word"
    }
];

// Audio Player Component - Isolated to prevent re-renders of the main screen
const AudioPlayer = memo(({ totalTime = 143 }: { totalTime?: number }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(16); // 0:16 in seconds, matching screenshot
  const progressInterval = useRef<any>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= totalTime) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying, totalTime]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, x / width));
    setCurrentTime(Math.floor(percentage * totalTime));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progress = (currentTime / totalTime) * 100;

  return (
    <div className="bg-surface-dark rounded-xl p-4 mb-6 border border-white/5 shadow-sm">
       <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-background-dark rounded-lg flex items-center justify-center shrink-0">
             <span className="material-symbols-outlined text-primary">music_note</span>
          </div>
          <div className="flex-1">
             <p className="font-bold text-sm text-text-main">Hausa Pronunciation</p>
             <p className="text-xs text-text-muted">Original Audio</p>
          </div>
          <button 
            onClick={togglePlay}
            className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-hover transition-transform active:scale-95 shadow-lg"
          >
             <span className="material-symbols-outlined text-xl">{isPlaying ? 'pause' : 'play_arrow'}</span>
          </button>
       </div>
       
       {/* Progress Bar - Increased click area */}
       <div 
         ref={progressBarRef}
         onClick={handleSeek}
         className="relative h-6 flex items-center mb-1 cursor-pointer group select-none touch-none"
       >
          <div className="absolute left-0 right-0 h-1 bg-white/10 rounded-full"></div>
          <div 
            className="absolute left-0 h-1 bg-primary rounded-full transition-all duration-100 ease-linear" 
            style={{ width: `${progress}%` }}
          ></div>
          <div 
            className="absolute w-3 h-3 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `calc(${progress}% - 6px)` }}
          ></div>
       </div>
       
       <div className="flex justify-between text-xs text-text-muted font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalTime)}</span>
       </div>
    </div>
  );
});

const ProverbDetailScreen: React.FC<Props> = ({ goBack, navigate }) => {
  const [isBookmarked, setIsBookmarked] = useState(true); // Default true to match screenshot color
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  // Interaction State
  const [mainVote, setMainVote] = useState<'up' | 'down' | null>(null);
  const [mainLikes, setMainLikes] = useState(1200);
  const [showComments, setShowComments] = useState(true);
  
  // Comment State
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS_DATA);
  const [commentText, setCommentText] = useState('');
  const [replyInputs, setReplyInputs] = useState<{[key: string]: string}>({});

  // Interactions
  const handleMainVote = (type: 'up' | 'down') => {
    if (mainVote === type) {
      setMainVote(null);
      if (type === 'up') setMainLikes(prev => prev - 1);
    } else {
      if (mainVote === 'up') setMainLikes(prev => prev - 1);
      setMainVote(type);
      if (type === 'up') setMainLikes(prev => prev + 1);
    }
  };

  const handleCommentLike = (id: string) => {
    setComments(prev => prev.map(c => {
      if (c.id === id) {
        const newIsLiked = !c.isLiked;
        return {
          ...c,
          isLiked: newIsLiked,
          likes: newIsLiked ? c.likes + 1 : c.likes - 1
        };
      }
      return c;
    }));
  };

  const handleToggleReply = (id: string) => {
    setComments(prev => prev.map(c => 
      c.id === id ? { ...c, isReplying: !c.isReplying } : c
    ));
  };

  const handleSubmitReply = (parentId: string) => {
    const text = replyInputs[parentId];
    if (!text?.trim()) return;

    const newReply: Reply = {
        id: Date.now().toString(),
        author: 'You',
        avatar: CURRENT_USER_AVATAR,
        text: text,
        time: 'Just now',
        likes: 0,
        isLiked: false
    };

    setComments(prev => prev.map(c => {
        if (c.id === parentId) {
            return {
                ...c,
                replies: [...c.replies, newReply],
                isReplying: false // Close reply box
            };
        }
        return c;
    }));

    // Clear input
    setReplyInputs(prev => ({...prev, [parentId]: ''}));
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      author: 'You',
      avatar: CURRENT_USER_AVATAR,
      text: commentText,
      time: 'Just now',
      likes: 0,
      isLiked: false,
      replies: [],
      isReplying: false
    };
    setComments([newComment, ...comments]);
    setCommentText('');
  };

  const handleSocialShare = (platform: string) => {
    const text = encodeURIComponent("Check out this proverb: Gaskiya ta fi kwabo (Truth is worth more than a penny)");
    const link = encodeURIComponent("https://samiati.app/proverb/gaskiya-ta-fi-kwabo");
    let url = '';

    switch (platform) {
        case 'whatsapp':
            url = `https://wa.me/?text=${text}%20${link}`;
            break;
        case 'twitter':
            url = `https://twitter.com/intent/tweet?text=${text}&url=${link}`;
            break;
        case 'facebook':
            url = `https://www.facebook.com/sharer/sharer.php?u=${link}`;
            break;
        case 'email':
            url = `mailto:?subject=${text}&body=${link}`;
            break;
    }
    
    if (url) window.open(url, '_blank');
    setIsShareOpen(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://samiati.app/proverb/gaskiya-ta-fi-kwabo");
    setToastMessage("Link copied to clipboard!");
    setTimeout(() => setToastMessage(null), 3000);
    setIsShareOpen(false);
  };

  const handleRelatedClick = (type: string) => {
    if (type === 'Story') navigate(Screen.STORY_DETAIL);
    else if (type === 'Word') navigate(Screen.WORD_DETAIL);
    else navigate(Screen.PROVERB_DETAIL); 
  };

  return (
    <div className="flex flex-col h-full bg-background-dark text-text-main font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center p-4 bg-background-dark sticky top-0 z-10 shrink-0 border-b border-white/5">
        <button onClick={goBack} className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1"></div>
        <button onClick={() => setIsBookmarked(!isBookmarked)} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
           <span className={`material-symbols-outlined ${isBookmarked ? 'fill-active text-primary' : ''}`}>
             {isBookmarked ? 'bookmark' : 'bookmark_border'}
           </span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-8 custom-scrollbar">
        {/* Author Info */}
        <div className="flex items-center gap-3 mb-6 mt-2">
           <img 
             src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6LZtwoRZLVf_mfFqdY11OX1RDMuLNBfzg-1-JqIap60sqItIczvKLkOwTmDA2J4pvgnJj5aFZAOk2PIeB-aYBeYRowNGFP8T6NhD2DXsMXeufNtSm-w5qmkobZjLTsvLwAACWIfN9watEHLy7hX6MckJh3IpQmn_5d1cs77_r6spZ27YrpgTvwW_gUlkhejzZ15PFd6Wav0M6iz-05tnZhk6UZkd-dSx3hIpX_jHEGKs4ob8uyhELqdeumxAYPV-uJ49KGz0AbDw" 
             className="w-10 h-10 rounded-full object-cover border border-white/10" 
             alt="Amina"
           />
           <div>
             <h3 className="font-bold text-sm text-text-main">Amina Kone</h3>
             <p className="text-xs text-text-muted">Posted 2 days ago</p>
           </div>
        </div>

        {/* Content */}
        <div className="mb-6">
           <h1 className="text-3xl font-bold text-text-main mb-2 leading-tight">Gaskiya ta fi kwabo</h1>
           <p className="text-text-muted text-base leading-relaxed">
             Translation: Truth is worth more than a penny (honesty is the best policy).
           </p>
        </div>

        {/* Isolated Audio Player */}
        <AudioPlayer totalTime={143} />

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-6 px-2">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => handleMainVote('up')}
                className={`flex items-center gap-2 group transition-colors ${mainVote === 'up' ? 'text-primary' : 'text-text-muted hover:text-text-main'}`}
              >
                 <span className={`material-symbols-outlined text-2xl ${mainVote === 'up' ? 'fill-active' : ''}`}>thumb_up</span>
                 <span className="font-bold text-sm">
                    {mainLikes >= 1000 ? (mainLikes / 1000).toFixed(1) + 'k' : mainLikes}
                 </span>
              </button>
              
              <button 
                onClick={() => handleMainVote('down')}
                className={`flex items-center gap-2 transition-colors ${mainVote === 'down' ? 'text-error' : 'text-text-muted hover:text-text-main'}`}
              >
                 <span className={`material-symbols-outlined text-2xl ${mainVote === 'down' ? 'fill-active' : ''}`}>thumb_down</span>
              </button>

              <button 
                 onClick={() => setShowComments(!showComments)}
                 className={`flex items-center gap-2 transition-colors ${showComments ? 'text-primary' : 'text-text-muted hover:text-text-main'}`}
              >
                 <span className={`material-symbols-outlined text-2xl ${showComments ? 'fill-active' : ''}`}>chat_bubble</span>
                 <span className="font-bold text-sm">{87 + comments.length}</span>
              </button>
           </div>
           
           <button 
             onClick={() => setIsShareOpen(true)}
             className="text-text-muted hover:text-text-main transition-colors"
           >
              <span className="material-symbols-outlined text-2xl">share</span>
           </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 w-full mb-6"></div>

        {/* Comments Section */}
        {showComments && (
            <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Add Comment Input */}
            <div className="flex gap-3 mb-6 items-start">
                <div className="w-8 h-8 rounded-full bg-surface-dark flex items-center justify-center shrink-0 border border-white/10 overflow-hidden">
                    <img src={CURRENT_USER_AVATAR} alt="You" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 relative">
                    <input 
                        type="text" 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add a comment..." 
                        className="w-full bg-surface-dark border border-transparent focus:border-primary rounded-full py-2 pl-4 pr-10 text-sm text-text-main placeholder-text-muted outline-none transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <button 
                        onClick={handleAddComment}
                        disabled={!commentText.trim()}
                        className="absolute right-1 top-1 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover transition-colors shadow-sm"
                    >
                        <span className="material-symbols-outlined text-sm font-bold">arrow_upward</span>
                    </button>
                </div>
            </div>

            {/* Comments List */}
            <div className="space-y-6">
                {comments.map((comment) => (
                    <div key={comment.id} className="animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex gap-3">
                            <img src={comment.avatar} alt={comment.author} className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10" />
                            <div className="flex-1">
                                <div className="bg-surface-dark p-3 rounded-2xl rounded-tl-none border border-white/5">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="font-bold text-sm text-text-main">{comment.author}</span>
                                        <span className="text-xs text-text-muted">{comment.time}</span>
                                    </div>
                                    <p className="text-sm text-text-main/90 leading-relaxed">{comment.text}</p>
                                </div>
                                
                                <div className="flex items-center gap-4 mt-1.5 ml-2">
                                    <button 
                                        onClick={() => handleCommentLike(comment.id)}
                                        className={`text-xs font-bold flex items-center gap-1 transition-colors ${comment.isLiked ? 'text-primary' : 'text-text-muted hover:text-text-main'}`}
                                    >
                                        <span className={`material-symbols-outlined text-xs ${comment.isLiked ? 'fill-active' : ''}`}>thumb_up</span>
                                        {comment.likes > 0 && <span>{comment.likes}</span>}
                                        {comment.likes === 0 && <span>Like</span>}
                                    </button>
                                    <button 
                                        onClick={() => handleToggleReply(comment.id)}
                                        className="text-xs font-bold text-text-muted hover:text-text-main transition-colors"
                                    >
                                        Reply
                                    </button>
                                </div>

                                {/* Reply Input */}
                                {comment.isReplying && (
                                    <div className="mt-3 flex gap-2 items-center animate-in fade-in slide-in-from-top-1">
                                        <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                                            <img src={CURRENT_USER_AVATAR} alt="You" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 relative">
                                            <input 
                                                type="text"
                                                autoFocus
                                                value={replyInputs[comment.id] || ''}
                                                onChange={(e) => setReplyInputs(prev => ({...prev, [comment.id]: e.target.value}))}
                                                placeholder={`Reply to ${comment.author}...`}
                                                className="w-full bg-surface-dark border border-white/10 rounded-full py-1.5 pl-3 pr-8 text-xs text-text-main focus:border-primary outline-none"
                                                onKeyDown={(e) => e.key === 'Enter' && handleSubmitReply(comment.id)}
                                            />
                                            <button 
                                                onClick={() => handleSubmitReply(comment.id)}
                                                disabled={!replyInputs[comment.id]?.trim()}
                                                className="absolute right-1 top-1 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-primary-hover"
                                            >
                                                <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Nested Replies */}
                                {comment.replies.length > 0 && (
                                    <div className="mt-3 space-y-3">
                                        {comment.replies.map(reply => (
                                            <div key={reply.id} className="flex gap-3">
                                                <img src={reply.avatar} alt={reply.author} className="w-6 h-6 rounded-full object-cover shrink-0 border border-white/10" />
                                                <div className="flex-1">
                                                    <div className="bg-surface-dark/60 p-2.5 rounded-2xl rounded-tl-none border border-white/5">
                                                        <div className="flex justify-between items-baseline mb-1">
                                                            <span className="font-bold text-xs text-text-main">{reply.author}</span>
                                                            <span className="text-[10px] text-text-muted">{reply.time}</span>
                                                        </div>
                                                        <p className="text-xs text-text-main/90 leading-relaxed">{reply.text}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 ml-2">
                                                        <button className="text-[10px] font-bold text-text-muted hover:text-text-main">Like</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            </div>
        )}

        {/* Related Section */}
        <div>
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-main">Related Changa</h3>
              <button 
                onClick={() => navigate(Screen.CONTRIBUTIONS)} 
                className="text-primary text-sm font-bold hover:underline"
              >
                See All
              </button>
           </div>
           <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {RELATED_CONTENT.map((item, i) => (
                 <div 
                    key={item.id} 
                    onClick={() => handleRelatedClick(item.type)}
                    className="min-w-[160px] w-[160px] bg-surface-dark rounded-xl overflow-hidden border border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                 >
                    <div className="h-28 bg-cover bg-center" style={{ backgroundImage: `url('${item.img}')` }}></div>
                    <div className="p-3">
                       <h4 className="font-bold text-sm text-text-main truncate mb-1">{item.title}</h4>
                       <p className="text-xs text-text-muted">{item.type}</p>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </main>

      {/* Share Modal */}
      {isShareOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans" onClick={() => setIsShareOpen(false)}>
            <div 
                className="bg-surface-dark w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200 border border-white/5" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-text-main">Share Proverb</h3>
                    <button onClick={() => setIsShareOpen(false)} className="p-1 rounded-full hover:bg-white/10 text-text-muted">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                        { name: 'WhatsApp', icon: 'chat', color: 'bg-[#25D366]', action: () => handleSocialShare('whatsapp') },
                        { name: 'Twitter', icon: 'flutter_dash', color: 'bg-[#1DA1F2]', action: () => handleSocialShare('twitter') },
                        { name: 'Facebook', icon: 'facebook', color: 'bg-[#1877F2]', action: () => handleSocialShare('facebook') },
                        { name: 'Email', icon: 'mail', color: 'bg-stone-500', action: () => handleSocialShare('email') },
                    ].map((platform) => (
                        <button key={platform.name} onClick={platform.action} className="flex flex-col items-center gap-2 group">
                            <div className={`w-14 h-14 rounded-full ${platform.color} flex items-center justify-center text-white shadow-md transform group-hover:scale-110 transition-transform`}>
                                <span className="material-symbols-outlined text-2xl">{platform.icon}</span>
                            </div>
                            <span className="text-xs font-medium text-text-muted">{platform.name}</span>
                        </button>
                    ))}
                </div>

                <div className="bg-black/20 p-3 rounded-xl flex items-center gap-3 border border-white/5">
                    <span className="material-symbols-outlined text-text-muted">link</span>
                    <input 
                        type="text" 
                        value="https://samiati.app/proverb/gaskiya-ta-fi-kwabo" 
                        readOnly 
                        className="flex-1 bg-transparent text-sm text-text-muted outline-none truncate"
                    />
                    <button 
                        onClick={handleCopyLink}
                        className="text-primary font-bold text-sm px-3 py-1.5 hover:bg-primary/10 rounded-lg transition-colors"
                    >
                        Copy
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Toast */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-text-main text-background-dark px-4 py-2 rounded-full shadow-lg font-bold text-sm transition-all duration-300 z-50 flex items-center gap-2 ${toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
         <span className="material-symbols-outlined text-success">check_circle</span>
         {toastMessage}
      </div>
    </div>
  );
};

export default ProverbDetailScreen;

