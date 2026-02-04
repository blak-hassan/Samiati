import { Message } from '@/types';

/**
 * Sends a message to the help assistant and returns a response.
 * This is a simplified local implementation that provides helpful responses
 * based on common questions about Samiati.
 */
export async function sendMessageToGemini(
    userMessage: string,
    conversationHistory: Message[]
): Promise<string> {
    // Simulate a small delay for a more natural feel
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    const lowerMessage = userMessage.toLowerCase();

    // FAQ-based responses for common topics
    if (lowerMessage.includes('xp') || lowerMessage.includes('experience') || lowerMessage.includes('points')) {
        return "You earn XP (Experience Points) through various activities:\n\n• Contributing words or phrases to the dictionary\n• Writing and sharing stories\n• Verifying other users' contributions\n• Completing daily challenges\n• Engaging with the community\n\nThe more you contribute, the more XP you earn!";
    }

    if (lowerMessage.includes('language') || lowerMessage.includes('translate')) {
        return "Samiati supports multiple Kenyan languages including Swahili, Kikuyu, Luo, Kalenjin, and more. You can:\n\n• Change your app language in Settings > App Experience\n• Use the translation feature in the chat\n• Contribute to languages you speak";
    }

    if (lowerMessage.includes('premium') || lowerMessage.includes('samiati+') || lowerMessage.includes('subscription')) {
        return "Samiati+ is our premium subscription that offers:\n\n• Unlimited translations\n• Exclusive cultural badges\n• Ad-free experience\n• Priority support\n• Offline access to your saved content\n\nYou can upgrade in Settings by tapping the Samiati+ banner.";
    }

    if (lowerMessage.includes('report') || lowerMessage.includes('flag') || lowerMessage.includes('inappropriate')) {
        return "To report inappropriate content:\n\n1. Tap the '...' menu on any post or comment\n2. Select 'Report'\n3. Choose a reason for reporting\n4. Submit the report\n\nOur moderation team reviews all reports within 24 hours.";
    }

    if (lowerMessage.includes('badge') || lowerMessage.includes('achievement')) {
        return "Badges are special achievements you earn by contributing to Samiati. You can unlock badges by:\n\n• Contributing a certain number of words\n• Reaching XP milestones\n• Completing challenges\n• Helping verify content\n\nView all your badges in your profile!";
    }

    if (lowerMessage.includes('privacy') || lowerMessage.includes('data') || lowerMessage.includes('security')) {
        return "Your privacy is important to us. You can manage your privacy settings in Settings > Data & Privacy. There you can:\n\n• Control who sees your profile\n• Manage blocked users\n• View and download your data\n• Delete your account if needed";
    }

    if (lowerMessage.includes('account') || lowerMessage.includes('profile') || lowerMessage.includes('edit')) {
        return "To edit your account or profile:\n\n1. Go to Settings\n2. Tap on your profile card at the top\n3. You can update your name, bio, avatar, and other details\n\nYou can also manage account settings like email and password in the Account section.";
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return "Hello! 👋 Welcome to Samiati Help Center. I'm here to answer your questions about using the app. What would you like to know about?";
    }

    if (lowerMessage.includes('thank')) {
        return "You're welcome! Is there anything else I can help you with?";
    }

    // Default response for unrecognized questions
    return "I'm here to help with questions about Samiati! Here are some topics I can assist with:\n\n• Earning XP and badges\n• Language settings and translation\n• Samiati+ premium features\n• Reporting content\n• Privacy and account settings\n\nFeel free to ask about any of these, or contact our support team for more specific help!";
}
