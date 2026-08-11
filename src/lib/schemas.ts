import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const composePostSchema = z.object({
  text: z.string().max(500, 'Post must be 500 characters or less'),
  cw: z.string().max(100, 'Content warning too long'),
  visibility: z.enum(['Public', 'Unlisted', 'Followers', 'Direct']),
  showPoll: z.boolean(),
  pollOptions: z.array(z.object({ value: z.string() })),
  pollDuration: z.string(),
});

export const contributionSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  input1: z.string().min(1, 'Content is required').max(5000),
  input2: z.string().min(1, 'Translation is required').max(5000),
  context: z.string().max(2000),
  tags: z.array(z.string()),
});

export const reportSchema = z.object({
  reason: z.string().min(1, 'Please select a reason'),
  details: z.string().max(1000).optional(),
});

export const moderatorApplicationSchema = z.object({
  motivation: z.string().min(10, 'Please explain why you want to be a moderator').max(500),
  languages: z.array(z.string()).min(1, 'Select at least one language'),
  experience: z.string().max(500).optional(),
});

export const communitySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  description: z.string().max(500).optional(),
  members: z.array(z.string()).default([]),
});

export const muteWordSchema = z.object({
  word: z.string().min(1, 'Word cannot be empty').max(50),
});

export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ComposePostFormData = z.infer<typeof composePostSchema>;
export type ContributionFormData = z.infer<typeof contributionSchema>;
export type ReportFormData = z.infer<typeof reportSchema>;
export type ModeratorApplicationFormData = z.infer<typeof moderatorApplicationSchema>;
export type CommunityFormData = z.infer<typeof communitySchema>;
export type MuteWordFormData = z.infer<typeof muteWordSchema>;
