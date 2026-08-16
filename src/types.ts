
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
  CHANGA = 'CHANGA',
  CHANGA_ACTIVITY = 'CHANGA_ACTIVITY',
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
  GROUP_VIEW = 'GROUP_VIEW',
  DARASA = 'DARASA'
}

export type NavigationParams = Record<string, unknown>;
export type NavigateFn = (screen: Screen, params?: NavigationParams) => void;
export type RouteSearchParams = Record<string, string | string[] | undefined>;

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
  // XP & Gamification fields
  streakDays?: number;           // Current contribution streak
  lastContributionDate?: string; // ISO date string for streak tracking
  contributionStats?: {
    totalApproved: number;
    totalPending: number;
    byType: Record<string, number>;     // e.g., { 'Word': 45, 'Story': 12 }
    byLanguage: Record<string, number>; // e.g., { 'Swahili': 30, 'Kikuyu': 27 }
  };
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
  type?: 'text' | 'image' | 'voice';
  status?: 'sending' | 'sent' | 'read';
  duration?: string;
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

// Aggregate returned by api.profile.queries.getDashboard — every number is
// computed server-side from real activity (spec §31/§32), never mocked.
export interface ProfileDashboard {
  profile: Record<string, unknown> & {
    isMe: boolean;
    isFollowing: boolean;
  };
  joinedAt: number;
  followerCount: number;
  followingCount: number;
  contribution: {
    total: number;
    accepted: number;
    inReview: number;
    drafts: number;
    needsFix: number;
    rejected: number;
    withdrawn: number;
    acceptRate: number;
    reviewAgreementRate: number;
    trustScore: number;
    validationCount: number;
    streakDays: number;
    voiceRecordings: number;
    voiceAccepted: number;
    byType: Record<string, { total: number; accepted: number }>;
    byLanguage: Record<string, { total: number; accepted: number }>;
    topLanguages: string[];
    badges: string[];
  };
  contributorLevel: { level: number; title: string };
  activeRoles: { languageCode: string; role: string }[];
  legacyContributionCount: number;
  timeline: Array<{
    kind: 'contribution' | 'validation';
    id: string;
    label: string;
    languageCode?: string;
    status?: string;
    snippet?: string;
    timestamp: number;
  }>;
  privacy: {
    profileVisible: boolean;
    showChanga: boolean;
    voiceDataAllowed: boolean;
    culturalDataAllowed: boolean;
  };
}

export interface ChatPreview {
  id: string;
  recipientId?: string;
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

export type ContributionStatus = 'Draft' | 'Live' | 'Under Review' | 'Needs Revision' | 'Declined';
export type ModerationStatus = 'pending' | 'approved' | 'needs_revision' | 'rejected';

export interface ModerationReview {
  moderator: {
    id: string;
    name: string;
    avatar: string;
    handle?: string;
  };
  action: 'approved' | 'critiqued' | 'rejected';
  comment?: string;
  timestamp: number;
}

export interface ContributionItem {
  id: string;
  type: 'Story' | 'Word' | 'Proverb' | 'Song' | 'Phrases' | 'Translate Paragraphs' | string;
  title: string;
  subtitle: string;
  // For 'My Contributions'
  status?: ContributionStatus;
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
  authorId?: string;
  challengeId?: string;
  language?: string;
  dialect?: string;
  partOfSpeech?: string;
  phoneticText?: string;
  examples?: { local: string; translation: string }[];
  languageCode?: string;
  moderationStatus?: ModerationStatus;
  reviewHistory?: ModerationReview[];
  moderatorNotes?: string;
  verificationScore?: number;
  verifiedBy?: string[];
  createdAt?: number;
  reviewedAt?: number;
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

export interface ValidationItem {
  id: string;
  type: 'Story' | 'Word' | 'Proverb' | 'Song' | 'Phrases' | 'Translation';
  language: string;
  languageCode: string;

  // Contribution content
  content: {
    original: string;
    translation?: string;
    meaning?: string;
    context?: string;
    audioUrl?: string;
  };

  // Author info
  author: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
  };

  // AI interpretation (for AI training context)
  aiInterpretation?: {
    suggestedTranslation?: string;
    confidence: number;
    linguisticNotes?: string;
  };

  // Community sentiment
  sentiment: {
    upvotes: number;
    downvotes: number;
    validations: number;
    userVote?: 'up' | 'down' | null;
  };

  // Moderation history
  reviews: ModerationReview[];

  // Status
  status: ModerationStatus;
  timestamp: string; // Using string to match Post timestamp format
}

export interface LanguageHealth {
  id: string;
  name: string;
  code: string;
  totalContributions: number;
  validatedContributions: number;
  pendingValidations: number;
  healthPercent: number; // 0-100
  targetContributions: number;
  isUserModerator: boolean;
}

export interface ModeratorRoleDetails {
  userId: string;
  languages: string[]; // Language codes they can moderate
  assignedAt: number;
  level: 'junior' | 'senior' | 'lead';
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

export type UserRole = 'admin' | 'moderator' | 'member' | 'guest';

export type InputType = 'TEXT' | 'LONG_TEXT' | 'AUDIO' | 'VIDEO' | 'IMAGE' | 'LOCATION' | 'SELECT';

export interface ChallengeInputField {
  id: string;
  type: InputType;
  label: string;
  required: boolean;
  options?: string[]; // For SELECT type
}


export type ChallengeType = 'ACCENT' | 'DIALECT' | 'ALPHABET' | 'TOTEM' | 'TRANSLATION' | 'STANDARD' | 'CUSTOM';

export interface ChallengeRole {
  userId: string;
  role: 'LEAD' | 'CONTRIBUTOR';
}

export interface Challenge {
  id: string;
  title: string;
  type: ChallengeType;
  description: string; // mapped from desc
  image: string; // mapped from img
  goalMetric: string;
  goalCount: number;
  currentCount: number;
  deadline?: string;
  roles?: ChallengeRole[];
  customConfig?: {
    region?: string;
    dialect?: string;
    language?: string;
  };
  goalDescription?: string;
  inputSchema?: ChallengeInputField[];
  // Legacy/Compatibility fields
  // Legacy/Compatibility fields
  desc?: string;
  img?: string;
  progress?: number;
  inputMode?: string;
}
