

import { NotificationItem, Conversation, ChatPreview, Post, LanguageSkill, ContributionItem, Screen, Community } from '@/types';


export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
    {
        id: '1',
        type: 'challenge',
        title: "New Challenge: 'Village Storytellers'",
        message: "A new weekly challenge has been posted. Share a story from your community to participate and earn rewards.",
        time: "2h ago",
        isRead: false,
        targetScreen: Screen.CONTRIBUTIONS
    },
    {
        id: '2',
        type: 'contribution',
        title: "Your link was approved!",
        message: "Congratulations! Your Changa to the 'Proverbs' collection has been approved by the community.",
        time: "1d ago",
        isRead: false,
        targetScreen: Screen.CONTRIBUTIONS
    },
    {
        id: '3',
        type: 'achievement',
        title: "Achievement Unlocked",
        message: "You've earned a new badge for your active participation and valuable Changa.",
        time: "3d ago",
        isRead: false,
        targetScreen: Screen.PROFILE
    },
    {
        id: '4',
        type: 'comment',
        title: "New comment on your story",
        message: "Amina replied: 'What a wonderful tale! This reminds me of the stories my grandmother used to tell.'",
        time: "5d ago",
        isRead: true,
        targetScreen: Screen.CONTRIBUTIONS
    },
    {
        id: '5',
        type: 'message',
        title: "New Message",
        message: "Kwame sent you a message: 'Hujambo!'",
        time: "10m ago",
        isRead: false,
        targetScreen: Screen.DM_LIST
    },
    {
        id: '6',
        type: 'moderation',
        title: "Flagged Content",
        message: "A comment requires your review.",
        time: "30m ago",
        isRead: false,
        targetScreen: Screen.MODERATION_DASHBOARD
    },
    {
        id: '7',
        type: 'follow',
        title: "New Follower",
        message: "Zahra Ali started following you.",
        time: "1h ago",
        isRead: false,
        targetScreen: Screen.PEOPLE_TO_FOLLOW
    }
];

const now = Date.now();
const day = 86400000;

export const INITIAL_CONVERSATIONS: Conversation[] = [
    {
        id: '1',
        title: 'Market Bargaining in Swahili',
        date: 'Yesterday, 3:45 PM',
        messageCount: 3,
        isPinned: true,
        lastActive: now - day,
        language: 'Swahili',
        languageCode: 'sw',
        category: 'word',
        viewCount: 127,
        messages: [
            { id: '101', sender: 'user', text: 'How do I ask for the price in Swahili?', timestamp: new Date() },
            { id: '102', sender: 'ai', text: 'You can say "Bei gani?" (How much is it?).', timestamp: new Date() },
            { id: '103', sender: 'user', text: 'And how do I say it is too expensive?', timestamp: new Date() }
        ]
    },
    {
        id: '2',
        title: 'Directions to the hotel',
        date: '2 days ago',
        messageCount: 2,
        isPinned: true,
        lastActive: now - (2 * day),
        language: 'Swahili',
        languageCode: 'sw',
        category: 'general',
        viewCount: 45,
        messages: [
            { id: '201', sender: 'user', text: 'I need to find the Serena Hotel.', timestamp: new Date() },
            { id: '202', sender: 'ai', text: 'I can help with phrases. Try "Natafuta Hoteli ya Serena".', timestamp: new Date() }
        ]
    },
    {
        id: '3',
        title: 'Chat with Aba about Folklore',
        date: '3 days ago',
        messageCount: 5,
        isPinned: false,
        lastActive: now - (3 * day),
        language: 'Yoruba',
        languageCode: 'yo',
        category: 'story',
        viewCount: 234,
        messages: [
            { id: '301', sender: 'ai', text: 'Do you know the story of Anansi the Spider?', timestamp: new Date() }
        ]
    },
    {
        id: '4',
        title: 'Taxi to the airport vocabulary',
        date: 'Sep 12, 2023',
        messageCount: 14,
        isPinned: false,
        lastActive: now - (5 * day),
        language: 'Swahili',
        languageCode: 'sw',
        category: 'word',
        viewCount: 89,
        messages: []
    },
    {
        id: '5',
        title: 'Meeting notes translation',
        date: 'Sep 10, 2023',
        messageCount: 35,
        isPinned: false,
        lastActive: now - (7 * day),
        language: 'Igbo',
        languageCode: 'ig',
        category: 'general',
        viewCount: 56,
        messages: []
    },
    {
        id: '6',
        title: 'Yoruba Proverbs Collection',
        date: 'Sep 8, 2023',
        messageCount: 12,
        isPinned: false,
        lastActive: now - (9 * day),
        language: 'Yoruba',
        languageCode: 'yo',
        category: 'proverb',
        viewCount: 312,
        messages: []
    },
    {
        id: '7',
        title: 'Traditional Wedding Songs',
        date: 'Sep 5, 2023',
        messageCount: 8,
        isPinned: false,
        lastActive: now - (12 * day),
        language: 'Igbo',
        languageCode: 'ig',
        category: 'song',
        viewCount: 178,
        messages: []
    },
    {
        id: '8',
        title: 'History of the Ashanti Kingdom',
        date: 'Sep 1, 2023',
        messageCount: 22,
        isPinned: false,
        lastActive: now - (15 * day),
        language: 'Akan',
        languageCode: 'ak',
        category: 'history',
        viewCount: 445,
        messages: []
    },
];


export const INITIAL_MESSAGES_CHATS: ChatPreview[] = [
    {
        id: '1',
        name: 'Kwame Mensah',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuGLE0i9NWNJMGLNeeS7Y-fkwpi4GavU-5tFQGjerfZBUK9A2baVE6a0v9b6Le6AIX-Xejh_WCf4Bb8tk8yqNXUeyVehi927mNkXbnvMb3ggvQTzfMzZcJc0kPiyaqMcPlts57mpPxJLq5-lgGwTjXzXNGyasv8_llUjyNVB2m-dLngZv8en8HyHDdbU1j_Wt2xl1HDaHg_iKgKX7HviRx7y_sXmAmU_NNuzZlrcnkbqtGL8NTvNgBOFaC4sSZ5yd97zBiTylIkog',
        lastMessage: 'Have you heard the new story about the tortoise?',
        time: '10:30 AM',
        unreadCount: 2,
        isOnline: true
    },
    {
        id: '2',
        name: 'Zahra Ali',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHGQCh7G1VnjuVj9331GPw-eizTILg3UcwDA4ENWzw4Y4k-YeCgWzwUxAmYXQWIcfUfbQwVHw6sT-X-LP9EspDfXqNOQnm6QUcAN3d9HAxoEJ5kesDAP6W6EUQ6odygBf2Q2-wGIcEgisM6jeCizwsbd9roCE4EDfeK74dHdCooeQh3_eioZBLFJNPfGi8Cp4ke9oJ11DKdl5pNseP-GKgaT-tyieX9Uimavj73AayhR3msq3f9Dcw-BdgSJNRK5-7MQYX9T0wH_8',
        lastMessage: 'Asante sana! That was very helpful.',
        time: 'Yesterday',
        unreadCount: 0,
        isOnline: false,
        status: 'read'
    },
    {
        id: '3',
        name: 'Chike Okoro',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCf35EoI1LYG_Z-DVruXrhf48EMhNAfhAbaIoN6aNxIOA7VWp8i9i-bmGhJmE0dqxwKZOscNOyTdZhqM8oDoilkrWcTxcmgWw_9TKUo8f2ASQEfAbbjXAelehx2KYPAN8W1qBGBDnvXJmTlMbdPIdPtbLjIMEeo6jhXcD7OkpFeAa7ECkhmLX-DoyYLYn3mUQ7yRcrIkO3DdTcFC-tZ0hxx31yGdTsr7k-44mC1gpIEDYR6Jk63r6sc1JtxESZ_z8CzlfVQD_p38c',
        lastMessage: 'Sent a photo',
        time: 'Yesterday',
        unreadCount: 0,
        isOnline: true,
        status: 'delivered'
    },
    {
        id: '4',
        name: 'Fatou Sow',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA33dgvI_8O1U2ZsGRRdIrN6msDVHDnzcOdKb2aEXmYC6BfYJvld3snbK7MQxEUsWkCLK5m9ry75kxZt9sfUj6Lj3S1keqVySoqqDOIddmUfbhh1NdpYKeiNphTGsh0op0pjtMhHziNPcUnCoOwh0BNylf0gclux6S7K-7-UHrGrvKE0tNqLQdIZ2zsi9R4Op0Mw2iKcHKarDj1ikZRS8LF2G1DNUTepgcMC76cBhfsNp4cHQ24AUuqP1KmseLie5Uq-O-YHLOwnM8',
        lastMessage: 'Are we still meeting for the language exchange?',
        time: 'Tuesday',
        unreadCount: 1,
        isOnline: false
    },
    {
        id: '5',
        name: 'Thabo Mokoena',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6LZtwoRZLVf_mfFqdY11OX1RDMuLNBfzg-1-JqIap60sqItIczvKLkOwTmDA2J4pvgnJj5aFZAOk2PIeB-aYBeYRowNGFP8T6NhD2DXsMXeufNtSm-w5qmkobZjLTsvLwAACWIfN9watEHLy7hX6MckJh3IpQmn_5d1cs77_r6spZ27YrpgTvwW_gUlkhejzZ15PFd6Wav0M6iz-05tnZhk6UZkd-dSx3hIpX_jHEGKs4ob8uyhELqdeumxAYPV-uJ49KGz0AbDw',
        lastMessage: 'Ndiyabulela (Thank you)',
        time: 'Monday',
        unreadCount: 0,
        isOnline: false,
        status: 'read'
    }
];

export const INITIAL_SOCIAL_POSTS: Post[] = [
    {
        id: 'p1',
        type: 'fireplace',
        author: { name: 'Nala Bekele', handle: 'nala_b', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwIbRrqJ4ZJ8GZcDvg3A8ICBI_glwNU2kT-sFW7-8qY1XYmEp5OPUPcOp1LTcTEL-9WOzc1bMxyURmWkWyrBOe5qFmcJy1VwLlI3U2fRprY3C452LNhCV5ucydy-MWIfij3s9wB7Womu3RmxEVpEBd6YW7i0ty-O2kqgzw4oYkynhtJWwuEqnWs0dyjiruGe25Bcsxd76N3hCs8K0KoGsEYyeM8qS63xvzlpMaTz-GZK-kI1D7zM4blUhv-JzuvkPJODszYC07wbc' },
        content: 'Late night tales: Myths of the Lake. Come listen!',
        timestamp: 'Live now',
        stats: { replies: 0, reposts: 0, likes: 0, validations: 0 },
        isLiked: false,
        isReposted: false,
        isValidated: false,
        isFireplace: true,
        fireplaceViewers: 142,
        fireplaceSpeakers: ['NB', 'KM', 'FS'],
        languageTag: 'English'
    },
    {
        id: 'p2',
        type: 'proverb',
        author: { name: 'Kwame Mensah', handle: 'kwame_m', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuGLE0i9NWNJMGLNeeS7Y-fkwpi4GavU-5tFQGjerfZBUK9A2baVE6a0v9b6Le6AIX-Xejh_WCf4Bb8tk8yqNXUeyVehi927mNkXbnvMb3ggvQTzfMzZcJc0kPiyaqMcPlts57mpPxJLq5-lgGwTjXzXNGyasv8_llUjyNVB2m-dLngZv8en8HyHDdbU1j_Wt2xl1HDaHg_iKgKX7HviRx7y_sXmAmU_NNuzZlrcnkbqtGL8NTvNgBOFaC4sSZ5yd97zBiTylIkog', badges: ['Elder'] },
        content: "Haraka haraka haina baraka.",
        proverbData: {
            original: "Haraka haraka haina baraka",
            translation: "Hurry hurry has no blessing.",
            meaning: "More haste, less speed. It is better to do things carefully than to rush and make mistakes."
        },
        timestamp: '2h ago',
        stats: { replies: 12, reposts: 34, likes: 156, validations: 45 },
        isLiked: true,
        isReposted: false,
        isValidated: true,
        languageTag: 'Swahili'
    },
    {
        id: 'p3',
        type: 'standard',
        author: { name: 'Zahra Ali', handle: 'zahra_ali', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHGQCh7G1VnjuVj9331GPw-eizTILg3UcwDA4ENWzw4Y4k-YeCgWzwUxAmYXQWIcfUfbQwVHw6sT-X-LP9EspDfXqNOQnm6QUcAN3d9HAxoEJ5kesDAP6W6EUQ6odygBf2Q2-wGIcEgisM6jeCizwsbd9roCE4EDfeK74dHdCooeQh3_eioZBLFJNPfGi8Cp4ke9oJ11DKdl5pNseP-GKgaT-tyieX9Uimavj73AayhR3msq3f9Dcw-BdgSJNRK5-7MQYX9T0wH_8', isVerified: true },
        content: 'Just finished reading "The River Between" by Ngũgĩ wa Thiong\'o. The descriptions of the landscape remind me so much of my grandmother\'s village. Has anyone else read it?',
        timestamp: '4h ago',
        stats: { replies: 8, reposts: 5, likes: 89, validations: 0 },
        isLiked: false,
        isReposted: false,
        isValidated: false,
        languageTag: 'English'
    },
    {
        id: 'p4',
        type: 'standard',
        author: { name: 'Chike Okoro', handle: 'chike_o', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCf35EoI1LYG_Z-DVruXrhf48EMhNAfhAbaIoN6aNxIOA7VWp8i9i-bmGhJmE0dqxwKZOscNOyTdZhqM8oDoilkrWcTxcmgWw_9TKUo8f2ASQEfAbbjXAelehx2KYPAN8W1qBGBDnvXJmTlMbdPIdPtbLjIMEeo6jhXcD7OkpFeAa7ECkhmLX-DoyYLYn3mUQ7yRcrIkO3DdTcFC-tZ0hxx31yGdTsr7k-44mC1gpIEDYR6Jk63r6sc1JtxESZ_z8CzlfVQD_p38c' },
        content: 'Look at the incredible detail in this traditional beadwork. Every color has a meaning.',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA33dgvI_8O1U2ZsGRRdIrN6msDVHDnzcOdKb2aEXmYC6BfYJvld3snbK7MQxEUsWkCLK5m9ry75kxZt9sfUj6Lj3S1keqVySoqqDOIddmUfbhh1NdpYKeiNphTGsh0op0pjtMhHziNPcUnCoOwh0BNylf0gclux6S7K-7-UHrGrvKE0tNqLQdIZ2zsi9R4Op0Mw2iKcHKarDj1ikZRS8LF2G1DNUTepgcMC76cBhfsNp4cHQ24AUuqP1KmseLie5Uq-O-YHLOwnM8',
        altText: 'Intricate Maasai beadwork necklace with red, yellow, and blue beads.',
        timestamp: '6h ago',
        stats: { replies: 2, reposts: 15, likes: 230, validations: 0 },
        isLiked: false,
        isReposted: true,
        isValidated: false,
        languageTag: 'English'
    },
    {
        id: 'p5',
        type: 'question',
        author: { name: 'Thabo Mokoena', handle: 'thabo_m', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6LZtwoRZLVf_mfFqdY11OX1RDMuLNBfzg-1-JqIap60sqItIczvKLkOwTmDA2J4pvgnJj5aFZAOk2PIeB-aYBeYRowNGFP8T6NhD2DXsMXeufNtSm-w5qmkobZjLTsvLwAACWIfN9watEHLy7hX6MckJh3IpQmn_5d1cs77_r6spZ27YrpgTvwW_gUlkhejzZ15PFd6Wav0M6iz-05tnZhk6UZkd-dSx3hIpX_jHEGKs4ob8uyhELqdeumxAYPV-uJ49KGz0AbDw' },
        content: 'Does anyone know the origin of the word "Safari"? I know it means journey in Swahili, but does it have deeper roots?',
        timestamp: '8h ago',
        stats: { replies: 24, reposts: 2, likes: 45, validations: 0 },
        isLiked: false,
        isReposted: false,
        isValidated: false,
        languageTag: 'English'
    },
    {
        id: 'p6',
        type: 'standard',
        author: { name: 'Amina Diallo', handle: 'amina_d', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTCkmqfVuPlLQ4IRyL2yV9d82xXGhUn6PZJQuyR-wOR0cvIaU2RmXVEYxrDKRF8LwvPO8ui_vLey4StEqf8CTMHBir5NqJ8BI6X6gXKzW2e5jtCmaOROPdLEoAJCmmFm51ht9zq7QwPnSBQC8TAqlJfRa5M4kLarJ9LqR6i2YIFBkKl3YmSCiPo77SFPw336bJQN6weNdBrPdUlu-Ta6wtwbzNsRkfyTwRr05-OJF-2JEsH1EwbuwH-dLxzpESsJxfK0fBRGIneoQ' },
        content: 'Check out the new story I posted about Anansi! It explains why spiders have thin legs.',
        timestamp: '12h ago',
        stats: { replies: 5, reposts: 8, likes: 67, validations: 0 },
        isLiked: false,
        isReposted: false,
        isValidated: false,
        languageTag: 'English'
    },
    {
        id: 'p7',
        type: 'standard',
        author: { name: 'Fatou Sow', handle: 'fatou_s', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA33dgvI_8O1U2ZsGRRdIrN6msDVHDnzcOdKb2aEXmYC6BfYJvld3snbK7MQxEUsWkCLK5m9ry75kxZt9sfUj6Lj3S1keqVySoqqDOIddmUfbhh1NdpYKeiNphTGsh0op0pjtMhHziNPcUnCoOwh0BNylf0gclux6S7K-7-UHrGrvKE0tNqLQdIZ2zsi9R4Op0Mw2iKcHKarDj1ikZRS8LF2G1DNUTepgcMC76cBhfsNp4cHQ24AUuqP1KmseLie5Uq-O-YHLOwnM8' },
        content: 'Discussion on the impact of colonial borders on language distribution in West Africa.',
        cw: 'Historical Discussion',
        timestamp: '1d ago',
        stats: { replies: 45, reposts: 12, likes: 88, validations: 0 },
        isLiked: false,
        isReposted: false,
        isValidated: false,
        languageTag: 'English'
    },
    {
        id: 'p8',
        type: 'standard',
        author: { name: 'Juma J.', handle: 'juma_j', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6LZtwoRZLVf_mfFqdY11OX1RDMuLNBfzg-1-JqIap60sqItIczvKLkOwTmDA2J4pvgnJj5aFZAOk2PIeB-aYBeYRowNGFP8T6NhD2DXsMXeufNtSm-w5qmkobZjLTsvLwAACWIfN9watEHLy7hX6MckJh3IpQmn_5d1cs77_r6spZ27YrpgTvwW_gUlkhejzZ15PFd6Wav0M6iz-05tnZhk6UZkd-dSx3hIpX_jHEGKs4ob8uyhELqdeumxAYPV-uJ49KGz0AbDw' },
        content: 'Which dialect should we focus on for next week\'s community challenge?',
        poll: {
            options: [
                { id: 'o1', label: 'Kikuyu', votes: 45 },
                { id: 'o2', label: 'Luo', votes: 32 },
                { id: 'o3', label: 'Kamba', votes: 15 },
                { id: 'o4', label: 'Maasai', votes: 28 }
            ],
            totalVotes: 120,
            endsAt: '2 days left'
        },
        timestamp: '1d ago',
        stats: { replies: 15, reposts: 4, likes: 22, validations: 0 },
        isLiked: false,
        isReposted: false,
        isValidated: false,
        languageTag: 'English'
    },
    {
        id: 'p9',
        type: 'standard',
        author: { name: 'Yoruba Learner', handle: 'yo_learner', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4lz2n92fP-3f8sFkeqH_L_kJ7Q2AZ-rKVTVq2mHkBM03IcR48LuFc52l2n01S6qFNeWfcKfWiRGfDWXx7jltQFbz09EH7Jmydr-dedWx_HiMM9BpKt4Q-KGq3CwTb0q_yQEwiNpQK3YPa8Jc0yYElrtn0iiMkXVI_6ThJOtnJOGkzZ5LVghgn3cawRvuHQuHSu6qXCXFuc78ULoKqjHj55wHc9kHkNIrpnsanbDaYLZo0KNkg3XyohzwahpixxUaa1hKfRo-GVro' },
        content: 'Bawo ni? Mo n kọ Yorùbá. (How are you? I am learning Yoruba.)',
        timestamp: '2d ago',
        stats: { replies: 5, reposts: 1, likes: 30, validations: 0 },
        isLiked: false,
        isReposted: false,
        isValidated: false,
        languageTag: 'Yoruba'
    },
    {
        id: 'p10',
        type: 'standard',
        author: { name: 'Samiati Official', handle: 'samiati_team', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKkfM9WqTPsqCfuM1KQIQ1QzsbiAaq2rab_EQ2MwL_8b9sbJ3-mIl3CjDCR888PPrsBNhkpl7tkden40rCqo3pJe3Sepe18k46KUvejTidyoAK941vcqejBnqRrcfC5hPZop_XFQ7S9jkteso1RvDSjv8s1JfGwGhOYE1uQ1M1J93quDxOniTqTNGD-1WZq2GOu_Z1EpzGjMzNeyvhYbuIwiqYK1TDLfGX5mpdg--_df6DoewiFO-RhrraeKpwY7MetQ94avb6spo', isVerified: true },
        content: 'We are looking for fluent Kamba speakers to help verify 500 new words in our dictionary. Earn double XP for every verification!',
        isBounty: true,
        timestamp: '3d ago',
        stats: { replies: 10, reposts: 50, likes: 120, validations: 0 },
        isLiked: false,
        isReposted: false,
        isValidated: false,
        languageTag: 'English'
    },
    {
        id: 'p11',
        type: 'standard',
        author: { name: 'Mzee Jomo', handle: 'mzee_jomo', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuGLE0i9NWNJMGLNeeS7Y-fkwpi4GavU-5tFQGjerfZBUK9A2baVE6a0v9b6Le6AIX-Xejh_WCf4Bb8tk8yqNXUeyVehi927mNkXbnvMb3ggvQTzfMzZcJc0kPiyaqMcPlts57mpPxJLq5-lgGwTjXzXNGyasv8_llUjyNVB2m-dLngZv8en8HyHDdbU1j_Wt2xl1HDaHg_iKgKX7HviRx7y_sXmAmU_NNuzZlrcnkbqtGL8NTvNgBOFaC4sSZ5yd97zBiTylIkog' },
        content: '#SamiatiHistory Do you know the origin of the Lunatic Express?',
        timestamp: '5h ago',
        stats: { replies: 18, reposts: 7, likes: 92, validations: 0 },
        isLiked: true,
        isReposted: false,
        isValidated: false,
        languageTag: 'English'
    },
    {
        id: 'p12',
        type: 'standard',
        author: { name: 'Folklore Keeper', handle: 'tales_m', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4lz2n92fP-3f8sFkeqH_L_kJ7Q2AZ-rKVTVq2mHkBM03IcR48LuFc52l2n01S6qFNeWfcKfWiRGfDWXx7jltQFbz09EH7Jmydr-dedWx_HiMM9BpKt4Q-KGq3CwTb0q_yQEwiNpQK3YPa8Jc0yYElrtn0iiMkXVI_6ThJOtnJOGkzZ5LVghgn3cawRvuHQuHSu6qXCXFuc78ULoKqjHj55wHc9kHkNIrpnsanbDaYLZo0KNkg3XyohzwahpixxUaa1hKfRo-GVro' },
        content: '#Folklore The Legend of Lwanda Magere. A warrior made of stone.',
        timestamp: '1h ago',
        stats: { replies: 5, reposts: 12, likes: 45, validations: 0 },
        isLiked: false,
        isReposted: false,
        isValidated: false,
        languageTag: 'Luo'
    },
    {
        id: 'p13',
        type: 'audio',
        author: { name: 'AfroBeats Archive', handle: 'afro_archive', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwIbRrqJ4ZJ8GZcDvg3A8ICBI_glwNU2kT-sFW7-8qY1XYmEp5OPUPcOp1LTcTEL-9WOzc1bMxyURmWkWyrBOe5qFmcJy1VwLlI3U2fRprY3C452LNhCV5ucydy-MWIfij3s9wB7Womu3RmxEVpEBd6YW7i0ty-O2kqgzw4oYkynhtJWwuEqnWs0dyjiruGe25Bcsxd76N3hCs8K0KoGsEYyeM8qS63xvzlpMaTz-GZK-kI1D7zM4blUhv-JzuvkPJODszYC07wbc' },
        content: 'Preserving the original rhythms. Listen to this.',
        timestamp: '30m ago',
        stats: { replies: 2, reposts: 8, likes: 110, validations: 0 },
        isLiked: false,
        isReposted: true,
        isValidated: false,
        languageTag: 'English'
    }
];

export const INITIAL_LANGUAGES_STATE: LanguageSkill[] = [
    { id: '1', name: 'Swahili', level: 'Conversational', percent: 60 },
    { id: '2', name: 'Yoruba', level: 'Learning', percent: 25 },
];

export const INITIAL_CONTRIBUTIONS: ContributionItem[] = [
    {
        id: '1',
        type: 'Word',
        title: 'Umoja',
        subtitle: 'Swahili • Noun • Posted 2 days ago',
        status: 'Live',
        statusColor: 'text-success',
        dotColor: 'bg-success',
        icon: 'translate',
        likes: 25,
        dislikes: 0,
        commentsCount: 3,
        userVote: null,
        comments: [],
        showComments: false
    },
    {
        id: '2',
        type: 'Story',
        title: 'The Lion and the Hare',
        subtitle: 'Folklore • Posted 1 week ago',
        status: 'Under Review',
        statusColor: 'text-warning',
        dotColor: 'bg-warning',
        icon: 'menu_book',
        likes: 0,
        dislikes: 0,
        commentsCount: 0,
        userVote: null,
        comments: [],
        showComments: false
    }
];

export const INITIAL_COMMUNITIES: Community[] = [
    {
        id: 'c1',
        name: 'Swahili Learners',
        description: 'A community for anyone learning Swahili at any level. Karibu!',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHGQCh7G1VnjuVj9331GPw-eizTILg3UcwDA4ENWzw4Y4k-YeCgWzwUxAmYXQWIcfUfbQwVHw6sT-X-LP9EspDfXqNOQnm6QUcAN3d9HAxoEJ5kesDAP6W6EUQ6odygBf2Q2-wGIcEgisM6jeCizwsbd9roCE4EDfeK74dHdCooeQh3_eioZBLFJNPfGi8Cp4ke9oJ11DKdl5pNseP-GKgaT-tyieX9Uimavj73AayhR3msq3f9Dcw-BdgSJNRK5-7MQYX9T0wH_8',
        coverImage: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=1000&auto=format&fit=crop',
        memberCount: 1240,
        isPrivate: false,
        role: 'member',
        category: 'Language',
        members: []
    },
    {
        id: 'c2',
        name: 'African Folklore Keepers',
        description: 'Sharing and preserving the ancient stories of the continent. Myth, legend, and history.',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwIbRrqJ4ZJ8GZcDvg3A8ICBI_glwNU2kT-sFW7-8qY1XYmEp5OPUPcOp1LTcTEL-9WOzc1bMxyURmWkWyrBOe5qFmcJy1VwLlI3U2fRprY3C452LNhCV5ucydy-MWIfij3s9wB7Womu3RmxEVpEBd6YW7i0ty-O2kqgzw4oYkynhtJWwuEqnWs0dyjiruGe25Bcsxd76N3hCs8K0KoGsEYyeM8qS63xvzlpMaTz-GZK-kI1D7zM4blUhv-JzuvkPJODszYC07wbc',
        coverImage: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=1000&auto=format&fit=crop',
        memberCount: 856,
        isPrivate: false,
        role: 'none',
        category: 'Culture',
        members: []
    },
    {
        id: 'c3',
        name: 'AfroBeats Lovers',
        description: 'The pulse of the continent. Sharing new tracks, classics, and discussing the evolution of African music.',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCf35EoI1LYG_Z-DVruXrhf48EMhNAfhAbaIoN6aNxIOA7VWp8i9i-bmGhJmE0dqxwKZOscNOyTdZhqM8oDoilkrWcTxcmgWw_9TKUo8f2ASQEfAbbjXAelehx2KYPAN8W1qBGBDnvXJmTlMbdPIdPtbLjIMEeo6jhXcD7OkpFeAa7ECkhmLX-DoyYLYn3mUQ7yRcrIkO3DdTcFC-tZ0hxx31yGdTsr7k-44mC1gpIEDYR6Jk63r6sc1JtxESZ_z8CzlfVQD_p38c',
        coverImage: 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?q=80&w=1000&auto=format&fit=crop',
        memberCount: 3000,
        isPrivate: false,
        role: 'none',
        category: 'Music',
        members: []
    }
];
