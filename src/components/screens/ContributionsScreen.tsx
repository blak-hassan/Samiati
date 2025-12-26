
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Screen, User, ContributionItem, Comment } from '@/types';
import { CulturalImpactCard } from '@/components/CulturalImpactCard';
import { ContributionStreakBadge } from '@/components/ContributionStreakBadge';
import { LanguageDiversityBadges } from '@/components/LanguageDiversityBadges';
import { ShareStoryPrompt } from '@/components/ShareStoryPrompt';
import ModerationDashboardScreen from './ModerationDashboardScreen';

interface Props {
    navigate: (screen: Screen, params?: any) => void;
    goBack: () => void;
    initialTab?: 'My Changa' | 'Moderation' | 'Challenges' | 'Saved';
    initialTypeFilter?: string;
    onViewProfile: (user: User) => void;
    myContributions?: ContributionItem[];
    setMyContributions?: React.Dispatch<React.SetStateAction<ContributionItem[]>>;
}

const CURRENT_USER_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuBeLXbWz4AzkUBDUb3vYkhuHrvvC9EFxb7YuDTFXSRV6e6T547HBjftD2_M3MWQ23u8DdygDU3-kcrmReHHcg1xuI2vz_fBK_UAfIaTV6tCpEh1xW7vkPs6qjbSwVjkqUkPXcPuBDRL_I0E_dA3ckyiMN2POsZ3M2E57RwaQqNiSED1NzWUTMmbbesb_Ko-z2BYoXtkkWP0lVOyL0aKlkzlpsNevnW1dPGKRZ5SxqpNtu6pvvjeFLtIUcElhd54x2R98mDwi_k8K4w";

const MODERATION_POSTS_DATA: ContributionItem[] = [
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
        comments: []
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
        comments: []
    }
];

const SAVED_DATA: ContributionItem[] = [
    {
        id: 's1',
        type: 'Proverb',
        title: 'Haraka haraka haina baraka',
        subtitle: 'Proverb • Saved 2 days ago',
        author: {
            name: 'Juma J.',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6LZtwoRZLVf_mfFqdY11OX1RDMuLNBfzg-1-JqIap60sqItIczvKLkOwTmDA2J4pvgnJj5aFZAOk2PIeB-aYBeYRowNGFP8T6NhD2DXsMXeufNtSm-w5qmkobZjLTsvLwAACWIfN9watEHLy7hX6MckJh3IpQmn_5d1cs77_r6spZ27YrpgTvwW_gUlkhejzZ15PFd6Wav0M6iz-05tnZhk6UZkd-dSx3hIpX_jHEGKs4ob8uyhELqdeumxAYPV-uJ49KGz0AbDw',
            handle: 'juma_j'
        },
        icon: 'format_quote',
        likes: 892,
        dislikes: 5,
        commentsCount: 45,
        userVote: null,
        showComments: false,
        comments: []
    },
    {
        id: 's2',
        type: 'Word',
        title: 'Ubuntu',
        subtitle: 'Word • Saved 1 week ago',
        author: {
            name: 'Thabo Mokoena',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6LZtwoRZLVf_mfFqdY11OX1RDMuLNBfzg-1-JqIap60sqItIczvKLkOwTmDA2J4pvgnJj5aFZAOk2PIeB-aYBeYRowNGFP8T6NhD2DXsMXeufNtSm-w5qmkobZjLTsvLwAACWIfN9watEHLy7hX6MckJh3IpQmn_5d1cs77_r6spZ27YrpgTvwW_gUlkhejzZ15PFd6Wav0M6iz-05tnZhk6UZkd-dSx3hIpX_jHEGKs4ob8uyhELqdeumxAYPV-uJ49KGz0AbDw',
            handle: 'thabo_m'
        },
        icon: 'translate',
        likes: 1205,
        dislikes: 0,
        commentsCount: 128,
        userVote: 'up',
        showComments: false,
        comments: []
    },
    {
        id: 's3',
        type: 'Story',
        title: 'The Hare and the Hyena',
        subtitle: 'Folklore • Saved 3 weeks ago',
        author: {
            name: 'Amina Diallo',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTCkmqfVuPlLQ4IRyL2yV9d82xXGhUn6PZJQuyR-wOR0cvIaU2RmXVEYxrDKRF8LwvPO8ui_vLey4StEqf8CTMHBir5NqJ8BI6X6gXKzW2e5jtCmaOROPdLEoAJCmmFm51ht9zq7QwPnSBQC8TAqlJfRa5M4kLarJ9LqR6i2YIFBkKl3YmSCiPo77SFPw336bJQN6weNdBrPdUlu-Ta6wtwbzNsRkfyTwRr05-OJF-2JEsH1EwbuwH-dLxzpESsJxfK0fBRGIneoQ',
            handle: 'amina_d'
        },
        icon: 'menu_book',
        likes: 45,
        dislikes: 0,
        commentsCount: 2,
        userVote: null,
        showComments: false,
        comments: []
    }
];

// Active Challenges Data - Updated as per user request
const ACTIVE_CHALLENGES = [
    {
        id: 'c1',
        title: "The Kikuyu 100",
        type: "Translation Drive",
        desc: "Help translate the 100 most common words in Kikuyu. Your knowledge builds our dictionary.",
        progress: 64,
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDgGK4HiP_WY3pOD4a5vjGWGtQqUUhOEyj94mc4Il4W9cK7uPISoDqA2_rAz6yx1hMgSr8B5pR8Q6cUCf4E81l5Yo--0f2oCHKyYXaSMxJOQKq6tn9MI-Cjx-_4Er3rmI0A8aTcqHLHpt7l2rEFyWita0CSiwer0MhunOiGwr3xKNC0bD-0tv8nalLieXnnzrSwIA5w9S3Fmuvy2UtBjpw7MdkR-USmYOn1ZIjsdIHGV9bFOVr97G958mCv7m40Q8Pa3Wq6A3Td9dk",
        action: "Start Teaching",
        screen: Screen.CHALLENGE_DETAILS,
        params: {
            challenge: {
                id: 'c1',
                title: "The Kikuyu 100",
                type: "Translation Drive",
                desc: "Help translate the 100 most common words in Kikuyu.",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDgGK4HiP_WY3pOD4a5vjGWGtQqUUhOEyj94mc4Il4W9cK7uPISoDqA2_rAz6yx1hMgSr8B5pR8Q6cUCf4E81l5Yo--0f2oCHKyYXaSMxJOQKq6tn9MI-Cjx-_4Er3rmI0A8aTcqHLHpt7l2rEFyWita0CSiwer0MhunOiGwr3xKNC0bD-0tv8nalLieXnnzrSwIA5w9S3Fmuvy2UtBjpw7MdkR-USmYOn1ZIjsdIHGV9bFOVr97G958mCv7m40Q8Pa3Wq6A3Td9dk",
                goal: "Translate the Basics",
                progress: 64,
                inputMode: 'Translation'
            }
        }
    },
    {
        id: 'c2',
        title: "Kalenjin Accent Preservation",
        type: "Voice Focused",
        desc: "Preserve the Kalenjin accent by recording everyday phrases.",
        progress: null,
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAVEz4UTCpp223l9QRsdxYGf4pegaKfIoxUYdvO2wPo8XCkY1wn0s7omDDuk5l9UfGHmSUMYiZUUiyeVrj5DHh5gKGghBS5J2alPWrLAd8VmA-CBLb7qbiOcvqYtIFuk8Iw9ZjCmIWsqxrq9lXoxaDfBKx3IEbV995TSPyPknJVXq7CE98Xs5Bc97lpSiqftZE4YnDIH4KY3CfDGILDtoz-44vJc1F-kNPQ3hBDDIXf21ifYT-byy_M-5rVvOpQ851C6YS0xkM3lcM",
        action: "Contribute Voice",
        screen: Screen.CHALLENGE_DETAILS,
        params: {
            challenge: {
                id: 'c2',
                title: "Kalenjin Accent",
                type: "Voice Focused",
                desc: "Record everyday phrases to preserve the authentic Kalenjin accent.",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAVEz4UTCpp223l9QRsdxYGf4pegaKfIoxUYdvO2wPo8XCkY1wn0s7omDDuk5l9UfGHmSUMYiZUUiyeVrj5DHh5gKGghBS5J2alPWrLAd8VmA-CBLb7qbiOcvqYtIFuk8Iw9ZjCmIWsqxrq9lXoxaDfBKx3IEbV995TSPyPknJVXq7CE98Xs5Bc97lpSiqftZE4YnDIH4KY3CfDGILDtoz-44vJc1F-kNPQ3hBDDIXf21ifYT-byy_M-5rVvOpQ851C6YS0xkM3lcM",
                goal: "Collect 500 Voice Samples",
                progress: 25,
                inputMode: 'Voice'
            }
        }
    },
    {
        id: 'c3',
        title: "Culinary Heritage",
        type: "Recipe Collection",
        desc: "Share traditional recipes and the stories behind them.",
        progress: 89,
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBeLXbWz4AzkUBDUb3vYkhuHrvvC9EFxb7YuDTFXSRV6e6T547HBjftD2_M3MWQ23u8DdygDU3-kcrmReHHcg1xuI2vz_fBK_UAfIaTV6tCpEh1xW7vkPs6qjbSwVjkqUkPXcPuBDRL_I0E_dA3ckyiMN2POsZ3M2E57RwaQqNiSED1NzWUTMmbbesb_Ko-z2BYoXtkkWP0lVOyL0aKlkzlpsNevnW1dPGKRZ5SxqpNtu6pvvjeFLtIUcElhd54x2R98mDwi_k8K4w",
        action: "Share Recipe",
        screen: Screen.CHALLENGE_DETAILS,
        params: {
            challenge: {
                id: 'c3',
                title: "Culinary Heritage",
                type: "Recipe Collection",
                desc: "Share traditional recipes and the stories behind them.",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBeLXbWz4AzkUBDUb3vYkhuHrvvC9EFxb7YuDTFXSRV6e6T547HBjftD2_M3MWQ23u8DdygDU3-kcrmReHHcg1xuI2vz_fBK_UAfIaTV6tCpEh1xW7vkPs6qjbSwVjkqUkPXcPuBDRL_I0E_dA3ckyiMN2POsZ3M2E57RwaQqNiSED1NzWUTMmbbesb_Ko-z2BYoXtkkWP0lVOyL0aKlkzlpsNevnW1dPGKRZ5SxqpNtu6pvvjeFLtIUcElhd54x2R98mDwi_k8K4w",
                goal: "Archive 100 Traditional Dishes",
                progress: 89,
                inputMode: 'Recipe'
            }
        }
    },
    {
        id: 'c4',
        title: "Alphabets of Origins",
        type: "Script Creation",
        desc: "Create or document alphabets for your indigenous language.",
        progress: 15,
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwIbRrqJ4ZJ8GZcDvg3A8ICBI_glwNU2kT-sFW7-8qY1XYmEp5OPUPcOp1LTcTEL-9WOzc1bMxyURmWkWyrBOe5qFmcJy1VwLlI3U2fRprY3C452LNhCV5ucydy-MWIfij3s9wB7Womu3RmxEVpEBd6YW7i0ty-O2kqgzw4oYkynhtJWwuEqnWs0dyjiruGe25Bcsxd76N3hCs8K0KoGsEYyeM8qS63xvzlpMaTz-GZK-kI1D7zM4blUhv-JzuvkPJODszYC07wbc",
        action: "Add Script",
        screen: Screen.CHALLENGE_DETAILS,
        params: {
            challenge: {
                id: 'c4',
                title: "Alphabets of Origins",
                type: "Script Creation",
                desc: "Help standardize or create digital alphabets for indigenous languages.",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwIbRrqJ4ZJ8GZcDvg3A8ICBI_glwNU2kT-sFW7-8qY1XYmEp5OPUPcOp1LTcTEL-9WOzc1bMxyURmWkWyrBOe5qFmcJy1VwLlI3U2fRprY3C452LNhCV5ucydy-MWIfij3s9wB7Womu3RmxEVpEBd6YW7i0ty-O2kqgzw4oYkynhtJWwuEqnWs0dyjiruGe25Bcsxd76N3hCs8K0KoGsEYyeM8qS63xvzlpMaTz-GZK-kI1D7zM4blUhv-JzuvkPJODszYC07wbc",
                goal: "Digitize 5 Scripts",
                progress: 15,
                inputMode: 'Script'
            }
        }
    },
    {
        id: 'c5',
        title: "Riddles of the Elders",
        type: "Folklore",
        desc: "Submit traditional riddles that challenge the mind.",
        progress: 42,
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAOIwrsG4DdrbXTAYf-WXRBaHgcqmT14MY_lmYvUkyZtg0RT_-_dHr_napeF6KMniL8zX6d4_A3RDIuiWm9yAZgdZNsgMfxya3pNJsh4WtKmq86hGYPf6PsZ1APxyHvNxwo803VmKszYhTsb0nAz5-Pxy_PLCdxtBBnmNAa-aAkGgOXRGmz1mu-iKxyz51wJ0BR7y9Nre3kHGXsNisV4cm71L-A43Q2DUXEuzYtM8CFrV2G7RI6c3hfmOgx8Mv-pQQhgBITOcU8TIE",
        action: "Share Riddle",
        screen: Screen.CHALLENGE_DETAILS,
        params: {
            challenge: {
                id: 'c5',
                title: "Riddles of the Elders",
                type: "Folklore",
                desc: "Submit traditional riddles that challenge the mind.",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAOIwrsG4DdrbXTAYf-WXRBaHgcqmT14MY_lmYvUkyZtg0RT_-_dHr_napeF6KMniL8zX6d4_A3RDIuiWm9yAZgdZNsgMfxya3pNJsh4WtKmq86hGYPf6PsZ1APxyHvNxwo803VmKszYhTsb0nAz5-Pxy_PLCdxtBBnmNAa-aAkGgOXRGmz1mu-iKxyz51wJ0BR7y9Nre3kHGXsNisV4cm71L-A43Q2DUXEuzYtM8CFrV2G7RI6c3hfmOgx8Mv-pQQhgBITOcU8TIE",
                goal: "Collect 200 Riddles",
                progress: 42,
                inputMode: 'Riddle'
            }
        }
    },
    {
        id: 'c6',
        title: "Songs of the Soil",
        type: "Music & Lullabies",
        desc: "Traditional songs and lullabies passed down generations.",
        progress: null,
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA33dgvI_8O1U2ZsGRRdIrN6msDVHDnzcOdKb2aEXmYC6BfYJvld3snbK7MQxEUsWkCLK5m9ry75kxZt9sfUj6Lj3S1keqVySoqqDOIddmUfbhh1NdpYKeiNphTGsh0op0pjtMhHziNPcUnCoOwh0BNylf0gclux6S7K-7-UHrGrvKE0tNqLQdIZ2zsi9R4Op0Mw2iKcHKarDj1ikZRS8LF2G1DNUTepgcMC76cBhfsNp4cHQ24AUuqP1KmseLie5Uq-O-YHLOwnM8",
        action: "Add Song",
        screen: Screen.CHALLENGE_DETAILS,
        params: {
            challenge: {
                id: 'c6',
                title: "Songs of the Soil",
                type: "Music & Lullabies",
                desc: "Traditional songs and lullabies passed down generations.",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA33dgvI_8O1U2ZsGRRdIrN6msDVHDnzcOdKb2aEXmYC6BfYJvld3snbK7MQxEUsWkCLK5m9ry75kxZt9sfUj6Lj3S1keqVySoqqDOIddmUfbhh1NdpYKeiNphTGsh0op0pjtMhHziNPcUnCoOwh0BNylf0gclux6S7K-7-UHrGrvKE0tNqLQdIZ2zsi9R4Op0Mw2iKcHKarDj1ikZRS8LF2G1DNUTepgcMC76cBhfsNp4cHQ24AUuqP1KmseLie5Uq-O-YHLOwnM8",
                goal: "Preserve 50 Songs",
                progress: 10,
                inputMode: 'Song'
            }
        }
    },
    {
        id: 'c7',
        title: "Clan Totems",
        type: "History & Symbols",
        desc: "Document the history and meaning of your clan symbols.",
        progress: 55,
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBCf35EoI1LYG_Z-DVruXrhf48EMhNAfhAbaIoN6aNxIOA7VWp8i9i-bmGhJmE0dqxwKZOscNOyTdZhqM8oDoilkrWcTxcmgWw_9TKUo8f2ASQEfAbbjXAelehx2KYPAN8W1qBGBDnvXJmTlMbdPIdPtbLjIMEeo6jhXcD7OkpFeAa7ECkhmLX-DoyYLYn3mUQ7yRcrIkO3DdTcFC-tZ0hxx31yGdTsr7k-44mC1gpIEDYR6Jk63r6sc1JtxESZ_z8CzlfVQD_p38c",
        action: "Share Totem",
        screen: Screen.CHALLENGE_DETAILS,
        params: {
            challenge: {
                id: 'c7',
                title: "Clan Totems",
                type: "History & Symbols",
                desc: "Document the history and meaning of your clan symbols.",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBCf35EoI1LYG_Z-DVruXrhf48EMhNAfhAbaIoN6aNxIOA7VWp8i9i-bmGhJmE0dqxwKZOscNOyTdZhqM8oDoilkrWcTxcmgWw_9TKUo8f2ASQEfAbbjXAelehx2KYPAN8W1qBGBDnvXJmTlMbdPIdPtbLjIMEeo6jhXcD7OkpFeAa7ECkhmLX-DoyYLYn3mUQ7yRcrIkO3DdTcFC-tZ0hxx31yGdTsr7k-44mC1gpIEDYR6Jk63r6sc1JtxESZ_z8CzlfVQD_p38c",
                goal: "Catalog 100 Totems",
                progress: 55,
                inputMode: 'Totem'
            }
        }
    }
];

// Past Challenges Data - 5 Items
const PAST_CHALLENGES = [
    {
        id: 'p1',
        title: "Language Basics: Greetings",
        date: "Ended Nov 30, 2023",
        badge: "Gold Badge Earned",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBCf35EoI1LYG_Z-DVruXrhf48EMhNAfhAbaIoN6aNxIOA7VWp8i9i-bmGhJmE0dqxwKZOscNOyTdZhqM8oDoilkrWcTxcmgWw_9TKUo8f2ASQEfAbbjXAelehx2KYPAN8W1qBGBDnvXJmTlMbdPIdPtbLjIMEeo6jhXcD7OkpFeAa7ECkhmLX-DoyYLYn3mUQ7yRcrIkO3DdTcFC-tZ0hxx31yGdTsr7k-44mC1gpIEDYR6Jk63r6sc1JtxESZ_z8CzlfVQD_p38c"
    },
    {
        id: 'p2',
        title: "Folklore Friday: Tricksters",
        date: "Ended Oct 25, 2023",
        badge: "Silver Badge Earned",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAVEz4UTCpp223l9QRsdxYGf4pegaKfIoxUYdvO2wPo8XCkY1wn0s7omDDuk5l9UfGHmSUMYiZUUiyeVrj5DHh5gKGghBS5J2alPWrLAd8VmA-CBLb7qbiOcvqYtIFuk8Iw9ZjCmIWsqxrq9lXoxaDfBKx3IEbV995TSPyPknJVXq7CE98Xs5Bc97lpSiqftZE4YnDIH4KY3CfDGILDtoz-44vJc1F-kNPQ3hBDDIXf21ifYT-byy_M-5rVvOpQ851C6YS0xkM3lcM"
    },
    {
        id: 'p3',
        title: "Riddles & Puzzles",
        date: "Ended Sep 15, 2023",
        badge: "Participant",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA33dgvI_8O1U2ZsGRRdIrN6msDVHDnzcOdKb2aEXmYC6BfYJvld3snbK7MQxEUsWkCLK5m9ry75kxZt9sfUj6Lj3S1keqVySoqqDOIddmUfbhh1NdpYKeiNphTGsh0op0pjtMhHziNPcUnCoOwh0BNylf0gclux6S7K-7-UHrGrvKE0tNqLQdIZ2zsi9R4Op0Mw2iKcHKarDj1ikZRS8LF2G1DNUTepgcMC76cBhfsNp4cHQ24AUuqP1KmseLie5Uq-O-YHLOwnM8"
    },
    {
        id: 'p4',
        title: "Traditional Attire",
        date: "Ended Aug 30, 2023",
        badge: "Bronze Badge Earned",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwIbRrqJ4ZJ8GZcDvg3A8ICBI_glwNU2kT-sFW7-8qY1XYmEp5OPUPcOp1LTcTEL-9WOzc1bMxyURmWkWyrBOe5qFmcJy1VwLlI3U2fRprY3C452LNhCV5ucydy-MWIfij3s9wB7Womu3RmxEVpEBd6YW7i0ty-O2kqgzw4oYkynhtJWwuEqnWs0dyjiruGe25Bcsxd76N3hCs8K0KoGsEYyeM8qS63xvzlpMaTz-GZK-kI1D7zM4blUhv-JzuvkPJODszYC07wbc"
    },
    {
        id: 'p5',
        title: "Songs of Harvest",
        date: "Ended Jul 12, 2023",
        badge: "Winner",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuD-V3E8jEaab6c5oqCwte8YO0FtTA-Q39LF02RVqSEIn-yFIxEXpqQNtov9YUVPsspoTd-G0IBX5eD3D1FcoYuaZ2D_obUh27Cgzr8TPZ-NFxlWutmC2r8AZ1IX4K6AJVN-WZkqrWzUYtGMn9bKxe6QkCpDd7wYm74pmBOZiwy9Z5UBxeeJs2ysKmBaR6jUiNoHpNBP7lzTP6QEx4IL-GexQtsOvMdHpFtTD_Mf778b0wdPEW-lb49hYodddCWGwok-y1Z7z_2zLgA"
    }
];

const ContributionsScreen: React.FC<Props> = ({ navigate, goBack, initialTab = 'My Changa', initialTypeFilter, onViewProfile, myContributions = [], setMyContributions }) => {
    const [activeTab, setActiveTab] = useState<'My Changa' | 'Moderation' | 'Challenges' | 'Saved'>(initialTab);

    // Filters for My Contributions
    const [myStatusFilter, setMyStatusFilter] = useState('All');
    const [myTypeFilter, setMyTypeFilter] = useState(initialTypeFilter || 'All');

    // Filters for Moderation Posts
    const [moderationTypeFilter, setModerationTypeFilter] = useState('All');

    // Filter Dropdown
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const typeFilterRef = useRef<HTMLDivElement>(null);

    // Scroll Header Logic
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const scrollY = useRef(0);
    const mainRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const [headerHeight, setHeaderHeight] = useState(0);

    // Share State
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [itemToShare, setItemToShare] = useState<ContributionItem | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        if (initialTypeFilter) {
            setMyTypeFilter(initialTypeFilter);
        }
    }, [initialTypeFilter]);

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

    // Measure Header Height
    useEffect(() => {
        if (headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight);
        }
    }, []);

    // Scroll Handler
    const handleScroll = () => {
        if (!mainRef.current) return;
        const currentScrollY = mainRef.current.scrollTop;
        const diff = currentScrollY - scrollY.current;

        // Ignore excessive negative scroll (bounce)
        if (currentScrollY < 0) return;

        if (diff > 10 && currentScrollY > 50) {
            // Scrolling Down & moved > 10px & not at very top
            setIsHeaderVisible(false);
        } else if (diff < -10) {
            // Scrolling Up & moved > 10px
            setIsHeaderVisible(true);
        }

        scrollY.current = currentScrollY;
    };

    // Data States
    const [savedContributions, setSavedContributions] = useState<ContributionItem[]>(SAVED_DATA);
    const [moderationPosts, setModerationPosts] = useState<ContributionItem[]>(MODERATION_POSTS_DATA);

    // Challenges State
    const [activeChallengeTab, setActiveChallengeTab] = useState<'active' | 'past'>('active');

    // Comment/Reply Inputs State
    const [inputTexts, setInputTexts] = useState<{ [key: string]: string }>({});
    const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({});

    const handleNavigate = (item: ContributionItem) => {
        if (item.type === 'Story') navigate(Screen.STORY_DETAIL);
        if (item.type === 'Word') navigate(Screen.WORD_DETAIL);
        if (item.type === 'Proverb') navigate(Screen.PROVERB_DETAIL);
    };

    const handleShareClick = (e: React.MouseEvent, item: ContributionItem) => {
        e.stopPropagation();
        setItemToShare(item);
        setShareModalOpen(true);
    };

    const handleSocialShare = (platform: string) => {
        if (!itemToShare) return;

        const shareUrl = `https://samiati.app/${itemToShare.type.toLowerCase()}/${itemToShare.id}`;
        const text = encodeURIComponent(`Check out this ${itemToShare.type}: "${itemToShare.title}" on Samiati!`);
        const link = encodeURIComponent(shareUrl);
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
                url = `mailto:?subject=${text}&body=Check out this contribution on Samiati: ${link}`;
                break;
        }

        if (url) window.open(url, '_blank');
        setShareModalOpen(false);
        setItemToShare(null);
    };

    const handleCopyLink = () => {
        if (!itemToShare) return;
        const shareUrl = `https://samiati.app/${itemToShare.type.toLowerCase()}/${itemToShare.id}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            setToastMessage("Link copied to clipboard!");
            setTimeout(() => setToastMessage(null), 3000);
            setShareModalOpen(false);
            setItemToShare(null);
        });
    };

    // Calculate Cultural Impact Metrics
    const { wordsPreserved, storiesShared, proverbsShared, communityReach, heritagePoints, uniqueLanguages } = useMemo(() => {
        const words = myContributions.filter(c => c.type === 'Word').length * 5;
        const stories = myContributions.filter(c => c.type === 'Story').length;
        const proverbs = myContributions.filter(c => c.type === 'Proverb').length;
        const reach = myContributions.reduce((sum, c) => sum + (c.likes || 0), 0);

        const points = words * 10 + stories * 50 + proverbs * 30 + reach * 2;

        // Mock languages for now as suggested in plan
        const langs = [
            { name: 'Swahili', code: 'sw', contributionCount: myContributions.filter(c => c.title.toLowerCase().includes('swahili') || c.subtitle.toLowerCase().includes('swahili') || c.id.startsWith('s')).length },
            { name: 'Yoruba', code: 'yo', contributionCount: myContributions.filter(c => c.title.toLowerCase().includes('yoruba') || c.subtitle.toLowerCase().includes('yoruba')).length }
        ].filter(l => l.contributionCount > 0);

        return {
            wordsPreserved: words,
            storiesShared: stories,
            proverbsShared: proverbs,
            communityReach: reach,
            heritagePoints: points,
            uniqueLanguages: langs
        };
    }, [myContributions]);

    const streakDays = 12; // Mock as per plan
    const nextMilestone = streakDays < 10 ? 10 : streakDays < 30 ? 30 : 100;

    const handleVote = (e: React.MouseEvent, id: string, voteType: 'up' | 'down', listType: 'my' | 'saved' | 'moderation') => {
        e.stopPropagation();
        let updateList;
        if (listType === 'my' && setMyContributions) updateList = setMyContributions;
        else if (listType === 'moderation') updateList = setModerationPosts;
        else updateList = setSavedContributions;

        updateList(prev => prev.map(item => {
            if (item.id !== id) return item;

            let newLikes = item.likes;
            let newDislikes = item.dislikes;
            let newVote = item.userVote;

            if (item.userVote === voteType) {
                newVote = null;
                if (voteType === 'up') newLikes--;
                else newDislikes--;
            } else {
                if (item.userVote === 'up') newLikes--;
                if (item.userVote === 'down') newDislikes--;

                newVote = voteType;
                if (voteType === 'up') newLikes++;
                else newDislikes++;
            }

            return { ...item, likes: newLikes, dislikes: newDislikes, userVote: newVote };
        }));
    };

    const toggleComments = (e: React.MouseEvent, id: string, listType: 'my' | 'saved' | 'moderation') => {
        e.stopPropagation();
        let updateList;
        if (listType === 'my' && setMyContributions) updateList = setMyContributions;
        else if (listType === 'moderation') updateList = setModerationPosts;
        else updateList = setSavedContributions;

        updateList(prev => prev.map(item =>
            item.id === id ? { ...item, showComments: !item.showComments } : item
        ));
    };

    const handleCommentVote = (e: React.MouseEvent, contributionId: string, commentId: string, voteType: 'up' | 'down', listType: 'my' | 'saved' | 'moderation') => {
        e.stopPropagation();
        let updateList;
        if (listType === 'my' && setMyContributions) updateList = setMyContributions;
        else if (listType === 'moderation') updateList = setModerationPosts;
        else updateList = setSavedContributions;

        const updateComments = (comments: Comment[]): Comment[] => {
            return comments.map(c => {
                if (c.id === commentId) {
                    let newLikes = c.likes;
                    let newDislikes = c.dislikes;
                    let newVote = c.userVote;

                    if (c.userVote === voteType) {
                        newVote = null;
                        if (voteType === 'up') newLikes--;
                        else newDislikes--;
                    } else {
                        if (c.userVote === 'up') newLikes--;
                        if (c.userVote === 'down') newDislikes--;
                        newVote = voteType;
                        if (voteType === 'up') newLikes++;
                        else newDislikes++;
                    }
                    return { ...c, likes: newLikes, dislikes: newDislikes, userVote: newVote };
                }
                if (c.replies.length > 0) {
                    return { ...c, replies: updateComments(c.replies) };
                }
                return c;
            });
        };

        updateList(prev => prev.map(item =>
            item.id === contributionId ? { ...item, comments: updateComments(item.comments) } : item
        ));
    };

    const toggleReplyInput = (e: React.MouseEvent, contributionId: string, commentId: string, listType: 'my' | 'saved' | 'moderation') => {
        e.stopPropagation();
        let updateList;
        if (listType === 'my' && setMyContributions) updateList = setMyContributions;
        else if (listType === 'moderation') updateList = setModerationPosts;
        else updateList = setSavedContributions;

        const updateComments = (comments: Comment[]): Comment[] => {
            return comments.map(c => {
                if (c.id === commentId) {
                    return { ...c, isReplying: !c.isReplying };
                }
                if (c.replies.length > 0) {
                    return { ...c, replies: updateComments(c.replies) };
                }
                return c;
            });
        };

        updateList(prev => prev.map(item =>
            item.id === contributionId ? { ...item, comments: updateComments(item.comments) } : item
        ));
    };

    const addComment = (contributionId: string, listType: 'my' | 'saved' | 'moderation') => {
        const text = inputTexts[contributionId];
        if (!text?.trim()) return;

        const newComment: Comment = {
            id: Date.now().toString(),
            author: 'You',
            avatar: CURRENT_USER_AVATAR,
            text: text,
            timestamp: 'Just now',
            likes: 0,
            dislikes: 0,
            userVote: null,
            replies: []
        };

        let updateList;
        if (listType === 'my' && setMyContributions) updateList = setMyContributions;
        else if (listType === 'moderation') updateList = setModerationPosts;
        else updateList = setSavedContributions;

        updateList(prev => prev.map(item =>
            item.id === contributionId ? {
                ...item,
                comments: [...item.comments, newComment],
                commentsCount: item.commentsCount + 1
            } : item
        ));

        setInputTexts(prev => ({ ...prev, [contributionId]: '' }));
    };

    const addReply = (contributionId: string, parentId: string, listType: 'my' | 'saved' | 'moderation') => {
        const text = replyTexts[parentId];
        if (!text?.trim()) return;

        const newReply: Comment = {
            id: Date.now().toString(),
            author: 'You',
            avatar: CURRENT_USER_AVATAR,
            text: text,
            timestamp: 'Just now',
            likes: 0,
            dislikes: 0,
            userVote: null,
            replies: []
        };

        const updateComments = (comments: Comment[]): Comment[] => {
            return comments.map(c => {
                if (c.id === parentId) {
                    return { ...c, replies: [...c.replies, newReply], isReplying: false };
                }
                if (c.replies.length > 0) {
                    return { ...c, replies: updateComments(c.replies) };
                }
                return c;
            });
        };

        let updateList;
        if (listType === 'my' && setMyContributions) updateList = setMyContributions;
        else if (listType === 'moderation') updateList = setModerationPosts;
        else updateList = setSavedContributions;

        updateList(prev => prev.map(item =>
            item.id === contributionId ? {
                ...item,
                comments: updateComments(item.comments),
                commentsCount: item.commentsCount + 1
            } : item
        ));

        setReplyTexts(prev => ({ ...prev, [parentId]: '' }));
    };

    const renderComments = (comments: Comment[], contributionId: string, listType: 'my' | 'saved' | 'moderation', depth = 0) => {
        return comments.map(comment => (
            <div key={comment.id} className={`flex gap-3 mt-4 ${depth > 0 ? 'ml-8 border-l-2 border-stone-100 dark:border-white/5 pl-4' : ''}`}>
                <img src={comment.avatar} alt={comment.author} className="w-8 h-8 rounded-full object-cover object-center shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="bg-stone-50 dark:bg-white/5 rounded-2xl rounded-tl-none p-3">
                        <div className="flex justify-between items-start">
                            <span className="font-bold text-sm text-stone-900 dark:text-white">{comment.author}</span>
                            <span className="text-xs text-stone-500 dark:text-text-muted">{comment.timestamp}</span>
                        </div>
                        <p className="text-sm text-stone-700 dark:text-text-main mt-1 break-words">{comment.text}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-1 ml-1">
                        <button onClick={(e) => handleCommentVote(e, contributionId, comment.id, 'up', listType)} className={`flex items-center gap-1 text-xs font-medium ${comment.userVote === 'up' ? 'text-primary' : 'text-stone-500 dark:text-text-muted hover:text-stone-900 dark:hover:text-white'}`}>
                            <span className={`material-symbols-outlined text-sm ${comment.userVote === 'up' ? 'fill-active' : ''}`}>thumb_up</span>
                            {comment.likes > 0 && <span>{comment.likes}</span>}
                        </button>
                        <button onClick={(e) => handleCommentVote(e, contributionId, comment.id, 'down', listType)} className={`flex items-center gap-1 text-xs font-medium ${comment.userVote === 'down' ? 'text-error' : 'text-stone-500 dark:text-text-muted hover:text-stone-900 dark:hover:text-white'}`}>
                            <span className={`material-symbols-outlined text-sm ${comment.userVote === 'down' ? 'fill-active' : ''}`}>thumb_down</span>
                        </button>
                        <button onClick={(e) => toggleReplyInput(e, contributionId, comment.id, listType)} className="text-xs font-bold text-stone-500 dark:text-text-muted hover:text-stone-900 dark:hover:text-white">Reply</button>
                    </div>
                    {comment.isReplying && (
                        <div className="mt-3 flex gap-2">
                            <input type="text" value={replyTexts[comment.id] || ''} onChange={(e) => setReplyTexts(prev => ({ ...prev, [comment.id]: e.target.value }))} placeholder="Write a reply..." className="flex-1 bg-stone-100 dark:bg-black/20 border-none rounded-full px-4 py-2 text-sm text-stone-900 dark:text-white focus:ring-1 focus:ring-primary outline-none" autoFocus onKeyDown={(e) => e.key === 'Enter' && addReply(contributionId, comment.id, listType)} />
                            <button onClick={() => addReply(contributionId, comment.id, listType)} disabled={!replyTexts[comment.id]?.trim()} className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-primary-hover"><span className="material-symbols-outlined text-lg">send</span></button>
                        </div>
                    )}
                    {comment.replies && comment.replies.length > 0 && renderComments(comment.replies, contributionId, listType, depth + 1)}
                </div>
            </div>
        ));
    };

    const renderContributionCard = (item: ContributionItem, listType: 'my' | 'saved' | 'moderation') => (
        <div key={item.id} className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-stone-200 dark:border-white/5 overflow-hidden transition-colors">
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                        {(listType === 'saved' || listType === 'moderation') && item.author ? (
                            <img
                                src={item.author.avatar}
                                alt={item.author.name}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onViewProfile({
                                        name: item.author!.name,
                                        handle: item.author!.handle || 'user',
                                        avatar: item.author!.avatar,
                                        isGuest: false
                                    });
                                }}
                                className="w-10 h-10 rounded-full object-cover object-center shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                            />
                        ) : (
                            <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center ${item.type === 'Story' ? 'bg-rasta-gold/10 text-amber-600 dark:bg-rasta-gold/20 dark:text-rasta-gold' : item.type === 'Word' ? 'bg-rasta-green/10 text-rasta-green dark:bg-rasta-green/30 dark:text-rasta-green' : 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'}`}>
                                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                            </div>
                        )}
                        <div>
                            {(listType === 'saved' || listType === 'moderation') && item.author ? (
                                <div className="flex items-center gap-2">
                                    <h3
                                        className="text-sm font-bold text-stone-900 dark:text-white cursor-pointer hover:underline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewProfile({
                                                name: item.author!.name,
                                                handle: item.author!.handle || 'user',
                                                avatar: item.author!.avatar,
                                                isGuest: false
                                            });
                                        }}
                                    >
                                        {item.author.name}
                                    </h3>
                                    <span className="text-xs text-stone-500 dark:text-text-muted">•</span>
                                    <span className="text-xs text-stone-500 dark:text-text-muted">{item.type}</span>
                                </div>
                            ) : (
                                <span className="text-xs font-bold text-stone-500 dark:text-text-muted uppercase tracking-wider">{item.type}</span>
                            )}
                            <p className="text-xs text-stone-500 dark:text-text-muted">{item.subtitle}</p>
                        </div>
                    </div>
                    {listType === 'my' && (
                        <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${item.dotColor}`}></span>
                            <span className={`text-xs font-bold ${item.statusColor}`}>{item.status}</span>
                        </div>
                    )}
                    {listType === 'saved' && (
                        <span className="material-symbols-outlined text-primary text-xl fill-active">bookmark</span>
                    )}
                </div>

                <h3 onClick={() => handleNavigate(item)} className="text-lg font-bold text-stone-900 dark:text-white mb-1 mt-2 cursor-pointer hover:text-primary transition-colors">{item.title}</h3>
            </div>

            <div className="px-4 py-3 border-t border-stone-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-stone-100 dark:bg-white/5 rounded-full px-2 py-1">
                        <button onClick={(e) => handleVote(e, item.id, 'up', listType)} className={`p-1 rounded-full hover:bg-stone-200 dark:hover:bg-white/10 transition-colors ${item.userVote === 'up' ? 'text-primary' : 'text-stone-500 dark:text-text-muted'}`}>
                            <span className={`material-symbols-outlined text-lg ${item.userVote === 'up' ? 'fill-active' : ''}`}>thumb_up</span>
                        </button>
                        <span className={`text-sm font-bold mx-1 ${item.userVote === 'up' ? 'text-primary' : item.userVote === 'down' ? 'text-error' : 'text-stone-700 dark:text-white'}`}>{item.likes}</span>

                        <div className="w-px h-4 bg-stone-300 dark:bg-white/20 mx-1"></div>

                        <button onClick={(e) => handleVote(e, item.id, 'down', listType)} className={`p-1 rounded-full hover:bg-stone-200 dark:hover:bg-white/10 transition-colors ${item.userVote === 'down' ? 'text-error' : 'text-stone-500 dark:text-text-muted'}`}>
                            <span className={`material-symbols-outlined text-lg ${item.userVote === 'down' ? 'fill-active' : ''}`}>thumb_down</span>
                        </button>
                    </div>
                    <button onClick={(e) => toggleComments(e, item.id, listType)} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors ${item.showComments ? 'bg-primary/10 text-primary' : 'hover:bg-stone-100 dark:hover:bg-white/5 text-stone-500 dark:text-text-muted'}`}>
                        <span className={`material-symbols-outlined text-lg ${item.showComments ? 'fill-active' : ''}`}>chat_bubble</span>
                        <span className="text-sm font-bold">{item.commentsCount}</span>
                    </button>
                </div>
                <button onClick={(e) => handleShareClick(e, item)} className="text-stone-400 dark:text-text-muted hover:text-stone-900 dark:hover:text-white transition-colors"><span className="material-symbols-outlined">share</span></button>
            </div>

            {item.showComments && (
                <div className="bg-stone-50/50 dark:bg-black/10 border-t border-stone-100 dark:border-white/5 p-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex gap-3 mb-4">
                        <img src={CURRENT_USER_AVATAR} alt="You" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        <div className="flex-1 flex gap-2">
                            <input type="text" value={inputTexts[item.id] || ''} onChange={(e) => setInputTexts(prev => ({ ...prev, [item.id]: e.target.value }))} placeholder="Add a comment..." className="flex-1 bg-white dark:bg-black/20 border border-stone-200 dark:border-white/10 rounded-full px-4 py-2 text-sm text-stone-900 dark:text-white focus:ring-1 focus:ring-primary outline-none" onKeyDown={(e) => e.key === 'Enter' && addComment(item.id, listType)} />
                            <button onClick={() => addComment(item.id, listType)} disabled={!inputTexts[item.id]?.trim()} className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-primary-hover shadow-sm"><span className="material-symbols-outlined text-lg">send</span></button>
                        </div>
                    </div>
                    <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                        {item.comments.length > 0 ? renderComments(item.comments, item.id, listType) : <div className="text-center py-4 text-stone-500 dark:text-text-muted text-sm">No comments yet.</div>}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-stone-50 dark:bg-background-dark text-stone-900 dark:text-text-main transition-colors duration-300 relative">
            {/* Scrollable Header Container */}
            <div
                ref={headerRef}
                className="transition-all duration-300 ease-in-out z-20 shadow-sm dark:shadow-none bg-white dark:bg-[#2B1F1C] absolute top-0 left-0 right-0"
                style={{ marginTop: isHeaderVisible ? 0 : -headerHeight }}
            >
                <header className="flex items-center p-4 bg-white dark:bg-[#2B1F1C] justify-between transition-colors shrink-0">
                    <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white"><span className="material-symbols-outlined">arrow_back</span></button>
                    <h1 className="flex-1 text-center text-lg font-bold">Changa</h1>
                    <button onClick={() => navigate(Screen.ADD_CONTRIBUTION)} className="p-2 -mr-2 text-primary hover:bg-primary/10 rounded-full transition-colors"><span className="material-symbols-outlined">add</span></button>
                </header>

                {/* Main Tabs */}
                <div className="flex p-2 bg-stone-50 dark:bg-[#2B1F1C] transition-colors shrink-0">
                    <div className="flex w-full bg-stone-200 dark:bg-white/5 rounded-xl p-1 overflow-x-auto no-scrollbar">
                        {['My Changa', 'Moderation', 'Challenges', 'Saved'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`flex-1 py-2 px-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-surface-dark text-stone-900 dark:text-white shadow-sm' : 'text-stone-500 dark:text-text-muted hover:text-stone-700 dark:hover:text-white'}`}
                            >
                                {tab === 'My Changa' ? 'My Posts' : tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <main
                ref={mainRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 custom-scrollbar"
                style={{ paddingTop: headerHeight > 0 ? headerHeight + 16 : 140 }}
            >
                {activeTab === 'My Changa' && (
                    <>
                        {/* Cultural Impact Metrics Section */}
                        {myContributions.length > 0 && (
                            <div className="space-y-4 mb-6">
                                <ContributionStreakBadge
                                    streakDays={streakDays}
                                    nextMilestone={nextMilestone}
                                    className="animate-in fade-in slide-in-from-top-4 duration-500"
                                />

                                <CulturalImpactCard
                                    wordsPreserved={wordsPreserved}
                                    storiesShared={storiesShared}
                                    communityReach={communityReach}
                                    heritagePoints={heritagePoints}
                                    className="animate-in fade-in slide-in-from-top-4 duration-500 delay-100"
                                />

                                {uniqueLanguages.length > 0 && (
                                    <LanguageDiversityBadges
                                        languages={uniqueLanguages}
                                        className="animate-in fade-in slide-in-from-top-4 duration-500 delay-200"
                                    />
                                )}

                                <ShareStoryPrompt
                                    onShareClick={() => navigate(Screen.ADD_CONTRIBUTION)}
                                    className="animate-in fade-in slide-in-from-top-4 duration-500 delay-300"
                                />
                            </div>
                        )}

                        {/* Status Filter Tabs */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-2">
                            {['All', 'Live', 'Under Review', 'Declined'].map(tab => (
                                <button key={tab} onClick={() => setMyStatusFilter(tab)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${myStatusFilter === tab ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900' : 'bg-white dark:bg-surface-dark text-stone-600 dark:text-text-muted border border-stone-200 dark:border-white/5'}`}>
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Type Filter */}
                        <div className="mb-4 relative z-10" ref={typeFilterRef}>
                            <button
                                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${myTypeFilter !== 'All'
                                    ? 'bg-primary text-white ring-2 ring-primary ring-offset-2 ring-offset-stone-50 dark:ring-offset-background-dark'
                                    : 'bg-white dark:bg-surface-dark text-stone-700 dark:text-text-muted border border-stone-200 dark:border-white/5 hover:bg-stone-50 dark:hover:bg-white/5'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-lg">filter_list</span>
                                <span>{myTypeFilter === 'All' ? 'Filter My Posts' : myTypeFilter}</span>
                                <span className={`material-symbols-outlined text-lg transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                            </button>

                            {isFilterDropdownOpen && (
                                <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-stone-200 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                    {['All', 'Story', 'Word', 'Proverb'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setMyTypeFilter(type);
                                                setIsFilterDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors border-b border-stone-100 dark:border-white/5 last:border-0 ${myTypeFilter === type
                                                ? 'bg-primary/5 text-primary font-bold'
                                                : 'text-stone-700 dark:text-text-main'
                                                }`}
                                        >
                                            <span>{type === 'All' ? 'All Types' : type}</span>
                                            {myTypeFilter === type && <span className="material-symbols-outlined text-lg">check</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {myContributions.filter(c =>
                            (myStatusFilter === 'All' || c.status === myStatusFilter) &&
                            (myTypeFilter === 'All' || c.type === myTypeFilter)
                        ).map(item => renderContributionCard(item, 'my'))}

                        {myContributions.filter(c =>
                            (myStatusFilter === 'All' || c.status === myStatusFilter) &&
                            (myTypeFilter === 'All' || c.type === myTypeFilter)
                        ).length === 0 && (
                                <div className="text-center py-10 opacity-50">
                                    <span className="material-symbols-outlined text-5xl mb-2">find_in_page</span>
                                    <p>No Changa found.</p>
                                </div>
                            )}

                        <div className="flex items-center justify-center pt-4">
                            <button onClick={() => navigate(Screen.ADD_CONTRIBUTION)} className="bg-stone-800 dark:bg-white text-white dark:text-stone-900 font-bold py-3 px-6 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                                <span className="material-symbols-outlined">add_circle</span>
                                Add New Changa
                            </button>
                        </div>
                    </>
                )}

                {activeTab === 'Moderation' && (
                    <div className="flex flex-col h-full -mx-4 -mt-4 bg-background-light dark:bg-background-dark overflow-hidden">
                        <ModerationDashboardScreen
                            navigate={navigate}
                            goBack={() => setActiveTab('My Changa')}
                            isEmbedded={true}
                        />
                    </div>
                )}

                {activeTab === 'Saved' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                        <div className="flex items-center gap-2 mb-2 px-2 text-stone-500 dark:text-text-muted text-sm">
                            <span className="material-symbols-outlined text-lg">bookmark</span>
                            <span>Only you can see your saved items.</span>
                        </div>
                        {savedContributions.length > 0 ? (
                            savedContributions.map(item => renderContributionCard(item, 'saved'))
                        ) : (
                            <div className="text-center py-16 opacity-60">
                                <span className="material-symbols-outlined text-6xl mb-3 text-stone-400">bookmark_border</span>
                                <p className="font-medium text-stone-600 dark:text-text-muted">No saved items yet.</p>
                                <p className="text-sm text-stone-500 dark:text-text-muted/70 mt-1">Tap the bookmark icon on stories and words to save them here.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'Challenges' && (
                    <>
                        <div className="flex border-b border-black/5 dark:border-white/5 mb-4">
                            <button onClick={() => setActiveChallengeTab('active')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeChallengeTab === 'active' ? 'text-primary border-primary' : 'text-stone-500 dark:text-text-muted border-transparent'}`}>Teach & Contribute</button>
                            <button onClick={() => setActiveChallengeTab('past')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeChallengeTab === 'past' ? 'text-primary border-primary' : 'text-stone-500 dark:text-text-muted border-transparent'}`}>Past Challenges</button>
                        </div>

                        {activeChallengeTab === 'active' ? (
                            <div className="space-y-6">
                                {ACTIVE_CHALLENGES.map((challenge) => (
                                    <div key={challenge.id} className="bg-white dark:bg-surface-dark rounded-2xl overflow-hidden shadow-sm border border-black/5 dark:border-white/5 transition-all hover:scale-[1.01] active:scale-[0.99]">
                                        <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url('${challenge.img}')` }}></div>
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-2"><span className="text-xs font-semibold text-primary uppercase tracking-wider bg-primary/10 px-2 py-1 rounded">{challenge.type}</span></div>
                                            <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-2">{challenge.title}</h3>
                                            <p className="text-stone-600 dark:text-text-muted text-sm mb-4">{challenge.desc}</p>

                                            {challenge.progress !== null && (
                                                <div className="mb-4">
                                                    <div className="flex justify-between text-xs mb-1.5 font-medium"><span className="text-stone-600 dark:text-text-muted">Goal Progress</span><span className="text-stone-900 dark:text-white">{challenge.progress}% Complete</span></div>
                                                    <div className="h-2 bg-black/10 dark:bg-black/30 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${challenge.progress}%` }}></div></div>
                                                </div>
                                            )}

                                            <button onClick={() => navigate(challenge.screen as any, challenge.params)} className={`w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${challenge.progress !== null ? 'bg-primary hover:bg-primary-hover text-white' : 'border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white hover:bg-stone-50 dark:hover:bg-white/5'}`}>
                                                {challenge.action === 'Start Teaching' && <span className="material-symbols-outlined">school</span>}
                                                {challenge.action === 'Contribute Voice' && <span className="material-symbols-outlined">mic</span>}
                                                {challenge.action}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {PAST_CHALLENGES.map((challenge) => (
                                    <div key={challenge.id} onClick={() => navigate(Screen.CHALLENGE_WINNERS)} className="bg-white dark:bg-surface-dark rounded-2xl overflow-hidden shadow-sm border border-black/5 dark:border-white/5 p-4 flex gap-4 cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                                        <div className="w-20 h-20 rounded-xl bg-cover bg-center shrink-0 grayscale opacity-80" style={{ backgroundImage: `url('${challenge.img}')` }}></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start"><h3 className="font-bold text-stone-900 dark:text-white truncate pr-2">{challenge.title}</h3><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-success/20 text-success uppercase">Completed</span></div>
                                            <p className="text-xs text-stone-500 dark:text-text-muted mt-1">{challenge.date}</p>
                                            <div className="flex items-center gap-2 mt-3"><span className="material-symbols-outlined text-yellow-500 text-lg">emoji_events</span><span className="text-sm font-semibold text-stone-700 dark:text-sand-beige">{challenge.badge}</span></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="fixed bottom-6 right-6 z-20">
                            <button onClick={() => navigate(Screen.ADD_CHALLENGE)} className="flex items-center gap-2 bg-stone-900 dark:bg-white dark:text-stone-900 text-white px-6 py-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105">
                                <span className="material-symbols-outlined">add</span><span className="font-bold">Create Teaching Challenge</span>
                            </button>
                        </div>
                    </>
                )}
            </main>

            {/* Share Modal */}
            {shareModalOpen && itemToShare && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans" onClick={() => { setShareModalOpen(false); setItemToShare(null); }}>
                    <div
                        className="bg-white dark:bg-surface-dark w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-stone-900 dark:text-white">Share {itemToShare.type}</h3>
                            <button onClick={() => { setShareModalOpen(false); setItemToShare(null); }} className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500 dark:text-text-muted">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-6">
                            {[
                                {
                                    name: 'WhatsApp',
                                    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/WhatsApp_icon.png/479px-WhatsApp_icon.png',
                                    action: () => handleSocialShare('whatsapp')
                                },
                                {
                                    name: 'Twitter',
                                    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Logo_of_Twitter.svg/512px-Logo_of_Twitter.svg.png',
                                    action: () => handleSocialShare('twitter')
                                },
                                {
                                    name: 'Facebook',
                                    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/2048px-2021_Facebook_icon.svg.png',
                                    action: () => handleSocialShare('facebook')
                                },
                                {
                                    name: 'Email',
                                    icon: 'mail',
                                    color: 'bg-stone-500',
                                    action: () => handleSocialShare('email')
                                },
                            ].map((platform: any) => (
                                <button key={platform.name} onClick={platform.action} className="flex flex-col items-center gap-2 group">
                                    {platform.src ? (
                                        <img
                                            src={platform.src}
                                            alt={platform.name}
                                            className="w-14 h-14 rounded-full object-cover shadow-md transform group-hover:scale-110 transition-transform"
                                        />
                                    ) : (
                                        <div className={`w-14 h-14 rounded-full ${platform.color} flex items-center justify-center text-white shadow-md transform group-hover:scale-110 transition-transform`}>
                                            <span className="material-symbols-outlined text-2xl">{platform.icon}</span>
                                        </div>
                                    )}
                                    <span className="text-xs font-medium text-stone-600 dark:text-text-muted">{platform.name}</span>
                                </button>
                            ))}
                        </div>

                        <div className="bg-stone-100 dark:bg-black/20 p-3 rounded-xl flex items-center gap-3 border border-stone-200 dark:border-white/5">
                            <span className="material-symbols-outlined text-stone-400">link</span>
                            <input
                                type="text"
                                value={`https://samiati.app/${itemToShare.type.toLowerCase()}/${itemToShare.id}`}
                                readOnly
                                className="flex-1 bg-transparent text-sm text-stone-600 dark:text-text-muted outline-none truncate"
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
            <div className={`fixed top-6 left-1/2 -translate-x-1/2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-6 py-3 rounded-full shadow-xl flex items-center gap-3 transition-all duration-300 z-[60] font-sans ${toastMessage ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
                <span className="material-symbols-outlined text-green-500 dark:text-green-600">check_circle</span>
                <span className="font-medium text-sm">{toastMessage}</span>
            </div>
        </div>
    );
};

export default ContributionsScreen;
