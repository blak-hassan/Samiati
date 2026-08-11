
import { ValidationItem } from '@/types';

export const INITIAL_MODERATION_ITEMS_EXTRA: ValidationItem[] = [
  // --- Song: Luo, needs_revision ---
  {
    id: 'mv_1',
    type: 'Song',
    language: 'Luo',
    languageCode: 'luo',
    content: {
      original: 'Nyathi Omodo. Nyathi omodo e budho, en wich kuot. Nyathi omodo e budho, en wich kuot. Yawa, yawa, nyathi omodo.',
      translation: 'The baby is sleeping. The baby is sleeping in the hut, she is the crown. The baby is sleeping in the hut, she is the crown. Oh my, oh my, the baby is sleeping.',
      context: 'Traditional Luo lullaby from the shores of Lake Victoria. Sung by grandmothers to put infants to sleep.',
      audioUrl: 'https://example.com/audio/luo-lullaby-01.mp3',
    },
    author: {
      id: 'u_luo_1',
      name: 'Achieng Otieno',
      handle: 'achieng_o',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA33dgvI_8O1U2ZsGRRdIrN6msDVHDnzcOdKb2aEXmYC6BfYJvld3snbK7MQxEUsWkCLK5m9ry75kxZt9sfUj6Lj3S1keqVySoqqDOIddmUfbhh1NdpYKeiNphTGsh0op0pjtMhHziNPcUnCoOwh0BNylf0gclux6S7K-7-UHrGrvKE0tNqLQdIZ2zsi9R4Op0Mw2iKcHKarDj1ikZRS8LF2G1DNUTepgcMC76cBhfsNp4cHQ24AUuqP1KmseLie5Uq-O-YHLOwnM8',
    },
    aiInterpretation: {
      suggestedTranslation: 'The child slumbers. The child slumbers in the shelter, she is the precious one.',
      confidence: 76,
      linguisticNotes: 'The Luo term "budho" can mean hut or shelter. "Wich kuot" is idiomatic for "crown/treasure" — the AI detected this metaphorical usage.',
    },
    sentiment: {
      upvotes: 31,
      downvotes: 3,
      validations: 6,
      userVote: null,
    },
    reviews: [
      {
        moderator: { id: 'm1', name: 'Sarah M.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', handle: 'sarah_m' },
        action: 'critiqued',
        comment: 'The translation captures the meaning but loses the rhythmic quality of the original. Consider a more poetic rendering.',
        timestamp: Date.now() - 1000 * 60 * 60 * 24,
      },
    ],
    status: 'needs_revision',
    timestamp: '3 days ago',
  },

  // --- Phrases: Yoruba, pending (fresh, no reviews) ---
  {
    id: 'mv_2',
    type: 'Phrases',
    language: 'Yoruba',
    languageCode: 'yo',
    content: {
      original: 'E kaaro. Bawo ni? Daadaa ni. O seun. E kaale.',
      translation: 'Good morning. How are you? I am fine. Thank you. Good evening.',
      meaning: 'Common Yoruba greetings for different times of day.',
      context: 'Standard Yoruba greetings collected from native speakers in Ibadan.',
    },
    author: {
      id: 'u_yo_1',
      name: 'Adebayo Ogunlesi',
      handle: 'adebayo_o',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4lz2n92fP-3f8sFkeqH_L_kJ7Q2AZ-rKVTVq2mHkBM03IcR48LuFc52l2n01S6qFNeWfcKfWiRGfDWXx7jltQFbz09EH7Jmydr-dedWx_HiMM9BpKt4Q-KGq3CwTb0q_yQEwiNpQK3YPa8Jc0yYElrtn0iiMkXVI_6ThJOtnJOGkzZ5LVghgn3cawRvuHQuHSu6qXCXFuc78ULoKqjHj55wHc9kHkNIrpnsanbDaYLZo0KNkg3XyohzwahpixxUaa1hKfRo-GVro',
    },
    aiInterpretation: {
      confidence: 97,
      suggestedTranslation: 'Good morning. How are you? Fine. Thank you. Good evening.',
      linguisticNotes: 'Standard greetings are correctly rendered. "E kaaro" (morning) and "E kaale" (evening) use the formal/polite prefix "E".',
    },
    sentiment: {
      upvotes: 15,
      downvotes: 0,
      validations: 3,
      userVote: null,
    },
    reviews: [],
    status: 'pending',
    timestamp: '2 days ago',
  },

  // --- Translation: Swahili, pending ---
  {
    id: 'mv_3',
    type: 'Translation',
    language: 'Swahili',
    languageCode: 'sw',
    content: {
      original: 'Juma na Chui walikuwa marafiki. Siku moja, Chui alimwambia Juma, "Twende kuwinda pamoja." Juma alikubali na wakaenda msituni.',
      translation: 'Juma and the Leopard were friends. One day, the Leopard told Juma, "Let us go hunting together." Juma agreed and they went to the forest.',
      context: 'A short Swahili children\'s story about friendship between humans and animals.',
    },
    author: {
      id: 'u_sw_1',
      name: 'Mwangi Kamau',
      handle: 'mwangi_k',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwIbRrqJ4ZJ8GZcDvg3A8ICBI_glwNU2kT-sFW7-8qY1XYmEp5OPUPcOp1LTcTEL-9WOzc1bMxyURmWkWyrBOe5qFmcJy1VwLlI3U2fRprY3C452LNhCV5ucydy-MWIfij3s9wB7Womu3RmxEVpEBd6YW7i0ty-O2kqgzw4oYkynhtJWwuEqnWs0dyjiruGe25Bcsxd76N3hCs8K0KoGsEYyeM8qS63xvzlpMaTz-GZK-kI1D7zM4blUhv-JzuvkPJODszYC07wbc',
    },
    aiInterpretation: {
      suggestedTranslation: 'Juma and the Leopard were friends. One day, the Leopard said to Juma, "Let\'s go hunting together." Juma agreed, and they went into the forest.',
      confidence: 88,
      linguisticNotes: 'The word "Chui" specifically means leopard, not cheetah. The translation correctly distinguishes this.',
    },
    sentiment: {
      upvotes: 42,
      downvotes: 1,
      validations: 8,
      userVote: null,
    },
    reviews: [],
    status: 'pending',
    timestamp: '1 day ago',
  },

  // --- Song: Kikuyu, rejected ---
  {
    id: 'mv_4',
    type: 'Song',
    language: 'Kikuyu',
    languageCode: 'ki',
    content: {
      original: 'Ciana cia Kikuyu, inai mũno. Ciana cia Kikuyu, inai mũno. Nyina wao nĩ Mũmbi, ithe wao nĩ Gĩkũyũ.',
      translation: 'Children of Kikuyu, sing loudly. Children of Kikuyu, sing loudly. Their mother is Mumbi, their father is Gikuyu.',
      context: 'A modern composition claiming to be a traditional Kikuyu song about the legendary founders.',
      audioUrl: 'https://example.com/audio/ki-contest-01.mp3',
    },
    author: {
      id: 'u_ki_1',
      name: 'Gitonga Mwangi',
      handle: 'gitonga_m',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCf35EoI1LYG_Z-DVruXrhf48EMhNAfhAbaIoN6aNxIOA7VWp8i9i-bmGhJmE0dqxwKZOscNOyTdZhqM8oDoilkrWcTxcmgWw_9TKUo8f2ASQEfAbbjXAelehx2KYPAN8W1qBGBDnvXJmTlMbdPIdPtbLjIMEeo6jhXcD7OkpFeAa7ECkhmLX-DoyYLYn3mUQ7yRcrIkO3DdTcFC-tZ0hxx31yGdTsr7k-44mC1gpIEDYR6Jk63r6sc1JtxESZ_z8CzlfVQD_p38c',
    },
    aiInterpretation: {
      confidence: 45,
      linguisticNotes: 'This appears to be a modern composition rather than a traditional song. The phrasing is not consistent with known Kikuyu oral traditions. Flagged for cultural authenticity review.',
    },
    sentiment: {
      upvotes: 4,
      downvotes: 22,
      validations: 1,
      userVote: null,
    },
    reviews: [
      {
        moderator: {
          id: 'm2',
          name: 'James K.',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
          handle: 'james_k',
        },
        action: 'rejected',
        comment: 'This is a modern song, not a traditional one as claimed. The submitter has misrepresented the origin.',
        timestamp: Date.now() - 1000 * 60 * 60 * 12,
      },
    ],
    status: 'rejected',
    timestamp: '4 days ago',
  },

  // --- Proverb: Yoruba, pending with multiple reviews ---
  {
    id: 'mv_5',
    type: 'Proverb',
    language: 'Yoruba',
    languageCode: 'yo',
    content: {
      original: 'A kì í fi ojú tí í tà ọ́ là á wo ilé',
      translation: 'We do not use the eye that is selling to look for the house',
      meaning: 'Do not rely on someone who is distracted to help you with an important matter.',
      context: 'A deep Yoruba proverb about focus and reliability. Commonly attributed to Ifá divination verses.',
    },
    author: {
      id: 'u_yo_2',
      name: 'Foluke Adedeji',
      handle: 'foluke_a',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHGQCh7G1VnjuVj9331GPw-eizTILg3UcwDA4ENWzw4Y4k-YeCgWzwUxAmYXQWIcfUfbQwVHw6sT-X-LP9EspDfXqNOQnm6QUcAN3d9HAxoEJ5kesDAP6W6EUQ6odygBf2Q2-wGIcEgisM6jeCizwsbd9roCE4EDfeK74dHdCooeQh3_eioZBLFJNPfGi8Cp4ke9oJ11DKdl5pNseP-GKgaT-tyieX9Uimavj73AayhR3msq3f9Dcw-BdgSJNRK5-7MQYX9T0wH_8',
    },
    aiInterpretation: {
      suggestedTranslation: 'One does not use the eye that is engaged in selling to search for a house',
      confidence: 71,
      linguisticNotes: 'Complex Yoruba metaphor. The AI detected the layered meaning — the person "selling" is distracted by commerce, making them unreliable. Human verification recommended.',
    },
    sentiment: {
      upvotes: 28,
      downvotes: 4,
      validations: 5,
      userVote: null,
    },
    reviews: [
      {
        moderator: { id: 'm1', name: 'Sarah M.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', handle: 'sarah_m' },
        action: 'approved',
        comment: 'Correct proverb with accurate cultural context.',
        timestamp: Date.now() - 1000 * 60 * 60 * 72,
      },
      {
        moderator: { id: 'm3', name: 'Tunde O.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tunde', handle: 'tunde_o' },
        action: 'critiqued',
        comment: 'The translation could be more literal to preserve the Ifá poetic structure.',
        timestamp: Date.now() - 1000 * 60 * 60 * 24,
      },
    ],
    status: 'pending',
    timestamp: '3 days ago',
  },

  // --- Word: Kikuyu, needs_revision (second iteration) ---
  {
    id: 'mv_6',
    type: 'Word',
    language: 'Kikuyu',
    languageCode: 'ki',
    content: {
      original: 'Omwani',
      translation: 'A person who shapes/creates (potter/creator)',
      meaning: 'A skilled craftsperson who shapes clay into pottery. Also used metaphorically for one who shapes destiny.',
      context: 'Second iteration after initial feedback. Original submission had incorrect dialectal variation.',
    },
    author: {
      id: 'u_current',
      name: 'Your Name',
      handle: 'you',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeLXbWz4AzkUBDUb3vYkhuHrvvC9EFxb7YuDTFXSRV6e6T547HBjftD2_M3MWQ23u8DdygDU3-kcrmReHHcg1xuI2vz_fBK_UAfIaTV6tCpEh1xW7vkPs6qjbSwVjkqUkPXcPuBDRL_I0E_dA3ckyiMN2POsZ3M2E57RwaQqNiSED1NzWUTMmbbesb_Ko-z2BYoXtkkWP0lVOyL0aKlkzlpsNevnW1dPGKRZ5SxqpNtu6pvvjeFLtIUcElhd54x2R98mDwi_k8K4w',
    },
    aiInterpretation: {
      confidence: 82,
      linguisticNotes: 'The revision correctly uses the Kikuyu "mw-" prefix for agent nouns. Previous version incorrectly used "mu-".',
    },
    sentiment: {
      upvotes: 7,
      downvotes: 0,
      validations: 2,
      userVote: null,
    },
    reviews: [
      {
        moderator: { id: 'm2', name: 'James K.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James', handle: 'james_k' },
        action: 'approved',
        comment: 'The spelling and definition now align with standard Gikuyu orthography.',
        timestamp: Date.now() - 1000 * 60 * 60 * 6,
      },
    ],
    status: 'needs_revision',
    timestamp: '5 hours ago',
  },
];
