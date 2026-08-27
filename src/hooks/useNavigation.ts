"use client";

import { useRouter } from "next/navigation";
import { Screen } from "../types";

export const useNavigation = () => {
    const router = useRouter();

    // Prefetch the target route so the JS chunk + RSC payload are already
    // cached when the user taps — makes screen transitions near-instant.
    const go = (path: string) => {
        router.prefetch(path);
        router.push(path);
    };

    const navigate = (screen: Screen, params?: Record<string, unknown>) => {
        // Construct query string if params exist
        let queryString = "";
        if (params) {
            const searchParams = new URLSearchParams();
            Object.keys(params).forEach(key => {
                const value = params[key];
                if (typeof value === 'string') searchParams.set(key, value);
                else searchParams.set(key, JSON.stringify(value));
            });
            queryString = "?" + searchParams.toString();
        }

        switch (screen) {
            case Screen.WELCOME: go("/"); break;
            case Screen.SIGN_IN: go("/sign-in"); break;
            case Screen.SIGN_UP: go("/sign-up"); break;
            case Screen.HOME_CHAT: go("/dashboard" + queryString); break;
            case Screen.FORGOT_PASSWORD: go("/forgot-password"); break;
            case Screen.RESET_LINK_SENT: go("/auth/reset-link-sent"); break;
            case Screen.SET_NEW_PASSWORD: go("/auth/set-new-password"); break;
            case Screen.PASSWORD_CHANGED: go("/auth/password-changed"); break;

            case Screen.PROFILE: go("/dashboard/profile" + queryString); break;
            case Screen.EDIT_PROFILE: go("/dashboard/edit-profile" + queryString); break;
            case Screen.GUEST_PROFILE: go("/dashboard/guest-profile" + queryString); break;
            case Screen.CONTRIBUTIONS: go("/dashboard/contributions" + queryString); break;
            case Screen.CHANGA_ACTIVITY: go("/dashboard/changa-activity" + queryString); break;
            case Screen.ADD_CONTRIBUTION: go("/dashboard/add-contribution" + queryString); break;
            case Screen.MESSAGES: go("/dashboard/feed" + queryString); break;
            case Screen.DM_LIST: go("/dashboard/messages" + queryString); break;
            case Screen.DIRECT_MESSAGE: go("/dashboard/direct-message" + queryString); break;
            case Screen.NOTIFICATIONS: go("/dashboard/notifications" + queryString); break;
            case Screen.SETTINGS: go("/dashboard/settings" + queryString); break;
            case Screen.SETTINGS_ACCOUNT: go("/dashboard/settings/account" + queryString); break;
            case Screen.SETTINGS_NOTIFICATIONS: go("/dashboard/settings/notifications" + queryString); break;
            case Screen.SETTINGS_PRIVACY: go("/dashboard/settings/privacy" + queryString); break;
            case Screen.MANAGE_LANGUAGES: go("/dashboard/settings/languages" + queryString); break;
            case Screen.SETTINGS_HELP: go("/dashboard/settings/help" + queryString); break;
            case Screen.SETTINGS_BLOCKED: go("/dashboard/settings/blocked" + queryString); break;
            case Screen.SETTINGS_MUTED: go("/dashboard/settings/muted" + queryString); break;
            case Screen.SETTINGS_DATA: go("/dashboard/settings/data" + queryString); break;

            case Screen.SAVED_CONVERSATIONS: go("/dashboard/saved-conversations" + queryString); break;
            case Screen.ALL_ACHIEVEMENTS: go("/dashboard/all-achievements" + queryString); break;
            case Screen.PEOPLE_TO_FOLLOW: go("/dashboard/people-to-follow" + queryString); break;
            case Screen.PROVERB_DETAIL: go("/dashboard/proverb-detail" + queryString); break;
            case Screen.STORY_DETAIL: go("/dashboard/story-detail" + queryString); break;
            case Screen.WORD_DETAIL: go("/dashboard/word-detail" + queryString); break;
            case Screen.POST_THREAD: go("/dashboard/post-thread" + queryString); break;
            case Screen.COMPOSE_POST: go("/dashboard/compose-post" + queryString); break;

            case Screen.MODERATION_DASHBOARD: go("/dashboard/moderation-dashboard" + queryString); break;
            case Screen.CHALLENGE_DETAILS: go("/dashboard/challenge-details" + queryString); break;
            case Screen.SUBMIT_ENTRY: go("/dashboard/submit-entry" + queryString); break;
            case Screen.ADD_CHALLENGE: go("/dashboard/add-challenge" + queryString); break;
            case Screen.SUGGEST_CHALLENGE: go("/dashboard/suggest-challenge" + queryString); break;
            case Screen.CHALLENGE_WINNERS: go("/dashboard/challenge-winners" + queryString); break;
            case Screen.CHALLENGE_CREATED: go("/dashboard/challenge-created" + queryString); break;
            case Screen.IDEA_SUBMITTED: go("/dashboard/idea-submitted" + queryString); break;
            case Screen.PASSWORD_CHANGED: go("/dashboard/password-changed" + queryString); break;
            case Screen.CHANGE_PASSWORD: go("/dashboard/change-password" + queryString); break;

            case Screen.VIDEO_CALL: go("/dashboard/video-call" + queryString); break;
            case Screen.VOICE_CALL: go("/dashboard/voice-call" + queryString); break;
            case Screen.CONTACT_INFO: go("/dashboard/contact-info" + queryString); break;
            case Screen.NEW_GROUP: go("/dashboard/new-group" + queryString); break;
            case Screen.NEW_CONTACT: go("/dashboard/new-contact" + queryString); break;
            case Screen.NEW_COMMUNITY: go("/dashboard/new-community" + queryString); break;
            case Screen.COMMUNITIES: go("/dashboard/communities" + queryString); break;
            case Screen.GROUP_VIEW: go("/dashboard/group-view" + queryString); break;
            case Screen.DARASA: go("/dashboard/darasa" + queryString); break;
            case Screen.DISCOVER: go("/dashboard/discover" + queryString); break;

            case Screen.MODERATION_LOG: go("/dashboard/moderation-log" + queryString); break;
            case Screen.MODERATION_APPLICATION: go("/dashboard/moderation-application" + queryString); break;
            case Screen.COMMENTS: go("/dashboard/comments" + queryString); break;
            case Screen.MANAGE_ENTRIES: go("/dashboard/manage-entries" + queryString); break;
            case Screen.REVIEW_ENTRY: go("/dashboard/review-entry" + queryString); break;
            case Screen.SUGGEST_LINK: go("/dashboard/suggest-link" + queryString); break;

            // Fallback for screens not fully mapped yet - we'll implement dynamic routes later
            default:
                if (Object.values(Screen).includes(screen)) {
                    go(`/dashboard/${screen.toLowerCase().replace(/_/g, '-')}${queryString}`);
                } else {
                    console.warn(`Route for ${screen} not implemented yet.`);
                }
        }
    };

    const goBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push("/dashboard");
        }
    };

    return { navigate, goBack };
};
