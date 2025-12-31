
export enum Screen {
  WELCOME = 'WELCOME',
  SIGN_IN = 'SIGN_IN',
  SIGN_UP = 'SIGN_UP',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  RESET_LINK_SENT = 'RESET_LINK_SENT',
  SET_NEW_PASSWORD = 'SET_NEW_PASSWORD',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  SOCIAL_AUTH_REDIRECT = 'SOCIAL_AUTH_REDIRECT',
  HOME_CHAT = 'HOME_CHAT',
  CHALLENGE_DETAILS = 'CHALLENGE_DETAILS',
  SUBMIT_ENTRY = 'SUBMIT_ENTRY',
  ADD_CHALLENGE = 'ADD_CHALLENGE',
  CHALLENGE_CREATED = 'CHALLENGE_CREATED',
  IDEA_SUBMITTED = 'IDEA_SUBMITTED',
  SUGGEST_CHALLENGE = 'SUGGEST_CHALLENGE',
  PROFILE = 'PROFILE',
  EDIT_PROFILE = 'EDIT_PROFILE',
  GUEST_PROFILE = 'GUEST_PROFILE',
  CONTRIBUTIONS = 'CONTRIBUTIONS',
  ADD_CONTRIBUTION = 'ADD_CONTRIBUTION',
  PEOPLE_TO_FOLLOW = 'PEOPLE_TO_FOLLOW',
  PROVERB_DETAIL = 'PROVERB_DETAIL',
  STORY_DETAIL = 'STORY_DETAIL',
  WORD_DETAIL = 'WORD_DETAIL',
  SAVED_CONVERSATIONS = 'SAVED_CONVERSATIONS',
  NOTIFICATIONS = 'NOTIFICATIONS',
  SETTINGS = 'SETTINGS',
  SETTINGS_ACCOUNT = 'SETTINGS_ACCOUNT',
  SETTINGS_NOTIFICATIONS = 'SETTINGS_NOTIFICATIONS',
  SETTINGS_PRIVACY = 'SETTINGS_PRIVACY',
  SETTINGS_ABOUT = 'SETTINGS_ABOUT',
  SETTINGS_HELP = 'SETTINGS_HELP',
  SETTINGS_BLOCKED = 'SETTINGS_BLOCKED',
  SETTINGS_MUTED = 'SETTINGS_MUTED',
  SETTINGS_DATA = 'SETTINGS_DATA',
  MODERATION_DASHBOARD = 'MODERATION_DASHBOARD',
  MODERATION_LOG = 'MODERATION_LOG',
  MODERATION_APPLICATION = 'MODERATION_APPLICATION',
  REPORT_MODAL = 'REPORT_MODAL', // Can be a modal or screen
  SUGGEST_LINK = 'SUGGEST_LINK',
  COMMENTS = 'COMMENTS',
  MANAGE_ENTRIES = 'MANAGE_ENTRIES',
  REVIEW_ENTRY = 'REVIEW_ENTRY',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
  CHALLENGE_WINNERS = 'CHALLENGE_WINNERS',
  ALL_ACHIEVEMENTS = 'ALL_ACHIEVEMENTS',
  MANAGE_LANGUAGES = 'MANAGE_LANGUAGES',
  MESSAGES = 'MESSAGES', // Now the Social Feed
  DM_LIST = 'DM_LIST', // The old chat list
  POST_THREAD = 'POST_THREAD', // Viewing a single post
  DIRECT_MESSAGE = 'DIRECT_MESSAGE',
  NEW_GROUP = 'NEW_GROUP',
  NEW_CONTACT = 'NEW_CONTACT',
  NEW_COMMUNITY = 'NEW_COMMUNITY',
  VIDEO_CALL = 'VIDEO_CALL',
  VOICE_CALL = 'VOICE_CALL',
  CONTACT_INFO = 'CONTACT_INFO',
  COMPOSE_POST = 'COMPOSE_POST',
  TERMS_OF_SERVICE = 'TERMS_OF_SERVICE',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  COMMUNITIES = 'COMMUNITIES',
  GROUP_VIEW = 'GROUP_VIEW'
}

export interface User {
  name: string;
  handle: string;
  avatar: string;
  isGuest: boolean;
  bio?: string;
  culturalBackground?: string;
  location?: string;
  role?: UserRole; // User's moderation role
  xp?: number;
  level?: number;
  badges?: string[];
  followerCount?: number;
  followingCount?: number;
  languages?: LanguageSkill[];
}

export interface Message {
  id: string;
  sender: 'user' | 'ai' | 'other' | 'system';
  text: string;
  translatedText?: string;
  targetLanguage?: string;
  timestamp: Date;
  feedback?: 'up' | 'down';
  comments?: string[];
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface Post {
  id: string;
  type?: 'standard' | 'proverb' | 'audio' | 'question' | 'fireplace';
  author: {
    name: string;
    handle: string;
    avatar: string;
    isVerified?: boolean;
    badges?: string[]; // e.g. 'Swahili Expert'
  };
  content: string;
  cw?: string; // Content Warning text. If present, content is hidden by default.

  // Specific fields for types
  proverbData?: {
    original: string;
    translation: string;
    meaning: string;
  };
  audioUrl?: string;

  image?: string;
  altText?: string; // Accessibility description for image

  poll?: {
    options: PollOption[];
    totalVotes: number;
    endsAt: string;
    userVotedOptionId?: string | null;
  };

  timestamp: string;
  stats: {
    replies: number;
    reposts: number;
    likes: number;
    validations: number; // "True/Valid" votes
  };
  isLiked: boolean;
  isReposted: boolean;
  isValidated: boolean; // User has clicked "Verify"
  replies?: Post[]; // For thread view
  languageTag?: string; // e.g., 'Swahili', 'Yoruba'

  // New Features
  region?: string; // e.g. "Nairobi"
  neighborhood?: string; // e.g. "Westlands"
  isBounty?: boolean;
  bountyXP?: number;
  dialect?: 'Standard' | 'Sheng' | 'Sanifu' | 'Pidgin' | 'Deep' | 'Urban';
  retellOf?: {
    id: string;
    author: string;
    preview: string;
  };
  isFireplace?: boolean; // Live Audio Room
  fireplaceViewers?: number;
  fireplaceSpeakers?: string[];
}

export interface NotificationItem {
  id: string;
  type: 'challenge' | 'contribution' | 'achievement' | 'comment' | 'system' | 'message' | 'moderation' | 'follow' | 'like' | 'repost';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  targetScreen?: Screen;
}

export interface Conversation {
  id: string;
  title: string;
  date: string;
  messageCount: number;
  isPinned: boolean;
  messages: Message[];
  lastActive: number;
  language?: string; // e.g., "Yoruba", "Swahili", "Igbo"
  languageCode?: string; // e.g., "yo", "sw", "ig"
  category?: 'proverb' | 'story' | 'song' | 'history' | 'word' | 'general'; // Cultural category
  viewCount?: number; // How many people viewed this contribution
}


export interface LanguageSkill {
  id: string;
  name: string;
  level: 'Learning' | 'Conversational' | 'Fluent' | 'Native';
  percent: number; // For visualization
}

export interface ChatPreview {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isOnline: boolean;
  status?: string; // e.g., 'sent', 'delivered', 'read'
  isGroup?: boolean;
  isCommunity?: boolean;
}

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
  likes: number;
  dislikes: number;
  userVote: 'up' | 'down' | null;
  replies: Comment[];
  isReplying?: boolean;
}

export interface ContributionItem {
  id: string;
  type: 'Story' | 'Word' | 'Proverb' | 'Song' | 'Phrases' | 'Translate Paragraphs' | string;
  title: string;
  subtitle: string;
  // For 'My Contributions'
  status?: 'Live' | 'Under Review' | 'Declined';
  statusColor?: string;
  dotColor?: string;
  // For 'Following'
  author?: {
    name: string;
    avatar: string;
    handle?: string; // Optional handle for profile navigation
  };
  icon: string;
  likes: number;
  dislikes: number;
  commentsCount: number;
  userVote: 'up' | 'down' | null;
  comments: Comment[];
  showComments: boolean;
  tags?: string[];
  attachments?: { id: string; type: string; url: string; name: string }[];
  content?: string;
  translation?: string;
  context?: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  avatar: string;
  coverImage: string;
  memberCount: number;
  isPrivate: boolean;
  role?: 'admin' | 'moderator' | 'member' | 'none'; // Current user's role
  category: 'Language' | 'Culture' | 'Music' | 'History' | 'General';
  members: string[]; // User IDs (mock)
}

// Moderation Types
export interface Report {
  id: string;
  type: 'comment' | 'link' | 'post';
  targetId: string;
  targetContent: string;
  contextTitle: string;
  contextId?: string;
  reasons: string[];
  reporter: {
    id: string;
    handle: string;
    avatar: string;
    name: string;
  };
  otherReporters?: number; // Count of duplicate reports
  timestamp: number;
  status: 'pending' | 'approved' | 'hidden' | 'deleted' | 'warned';
  resolvedAt?: number;
  resolvedBy?: string;
  moderatorNotes?: string;
}

export interface ModeratorStats {
  totalReports: number;
  resolvedToday: number;
  pendingReports: number;
  avgResolutionTime: number; // in minutes
  userResolvedCount: number; // This moderator's stats
}

export enum ReportReason {
  SPAM = 'Spam',
  HATE_SPEECH = 'Hate Speech',
  MISINFORMATION = 'Misinformation',
  INAPPROPRIATE = 'Inappropriate',
  MALICIOUS_LINK = 'Malicious Link',
  HARASSMENT = 'Harassment',
  OTHER = 'Other'
}

export type UserRole = 'admin' | 'moderator' | 'member';

