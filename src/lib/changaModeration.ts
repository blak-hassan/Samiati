import {
  ContributionItem,
  ContributionStatus,
  ModerationStatus,
  ValidationItem,
} from '@/types';

const DEFAULT_LANGUAGE = {
  name: 'Swahili',
  code: 'sw',
};

const statusMeta: Record<ContributionStatus, { statusColor: string; dotColor: string }> = {
  'Live': { statusColor: 'text-success', dotColor: 'bg-success' },
  'Under Review': { statusColor: 'text-warning', dotColor: 'bg-warning' },
  'Needs Revision': { statusColor: 'text-rasta-gold', dotColor: 'bg-rasta-gold' },
  'Declined': { statusColor: 'text-error', dotColor: 'bg-error' },
};

export const mapModerationStatusToContributionStatus = (
  status: ModerationStatus,
): ContributionStatus => {
  switch (status) {
    case 'approved':
      return 'Live';
    case 'needs_revision':
      return 'Needs Revision';
    case 'rejected':
      return 'Declined';
    case 'pending':
    default:
      return 'Under Review';
  }
};

export const mapContributionStatusToModerationStatus = (
  status?: ContributionStatus,
): ModerationStatus => {
  switch (status) {
    case 'Live':
      return 'approved';
    case 'Needs Revision':
      return 'needs_revision';
    case 'Declined':
      return 'rejected';
    case 'Under Review':
    default:
      return 'pending';
  }
};

export const getContributionStatusMeta = (status: ContributionStatus) => statusMeta[status];

export const getLatestModeratorNote = (item: ContributionItem) =>
  [...(item.reviewHistory || [])].reverse().find((review) => review.comment?.trim())?.comment;

export const normalizeContributionItem = (
  item: ContributionItem,
  author: { id: string; name: string; handle: string; avatar: string },
): ContributionItem => {
  const moderationStatus = item.moderationStatus || mapContributionStatusToModerationStatus(item.status);
  const authorStatus = mapModerationStatusToContributionStatus(moderationStatus);
  const meta = getContributionStatusMeta(authorStatus);
  const latestNote = item.moderatorNotes || getLatestModeratorNote(item);

  return {
    ...item,
    author: item.author || {
      name: author.name,
      avatar: author.avatar,
      handle: author.handle,
    },
    authorId: item.authorId || author.id,
    language: item.language || DEFAULT_LANGUAGE.name,
    languageCode: item.languageCode || DEFAULT_LANGUAGE.code,
    moderationStatus,
    status: authorStatus,
    statusColor: item.statusColor || meta.statusColor,
    dotColor: item.dotColor || meta.dotColor,
    reviewHistory: item.reviewHistory || [],
    moderatorNotes: latestNote,
    createdAt: item.createdAt || Date.now(),
  };
};

export const buildValidationItemFromContribution = (
  item: ContributionItem,
): ValidationItem => ({
  id: item.id,
  type: item.type === 'Translate Paragraphs' ? 'Translation' : (item.type as ValidationItem['type']),
  language: item.language || DEFAULT_LANGUAGE.name,
  languageCode: item.languageCode || DEFAULT_LANGUAGE.code,
  content: {
    original: item.content || item.title,
    translation: item.translation,
    context: item.context,
  },
  author: {
    id: item.authorId || 'u_current',
    name: item.author?.name || 'You',
    handle: item.author?.handle || 'you',
    avatar: item.author?.avatar || '',
  },
  sentiment: {
    upvotes: item.likes || 0,
    downvotes: item.dislikes || 0,
    validations: item.reviewHistory?.filter((review) => review.action === 'approved').length || 0,
    userVote: item.userVote || null,
  },
  reviews: item.reviewHistory || [],
  status: item.moderationStatus || mapContributionStatusToModerationStatus(item.status),
  timestamp: item.subtitle,
});
