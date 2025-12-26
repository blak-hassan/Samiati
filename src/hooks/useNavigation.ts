"use client";

import { useRouter } from "next/navigation";
import { Screen } from "../types";

export const useNavigation = () => {
    const router = useRouter();

    const navigate = (screen: Screen, params?: any) => {
        // Construct query string if params exist
        let queryString = "";
        if (params) {
            const searchParams = new URLSearchParams();
            Object.keys(params).forEach(key => {
                if (typeof params[key] === 'string') searchParams.set(key, params[key]);
                else searchParams.set(key, JSON.stringify(params[key]));
            });
            queryString = "?" + searchParams.toString();
        }

        switch (screen) {
            case Screen.WELCOME: router.push("/"); break;
            case Screen.SIGN_IN: router.push("/"); break; // Home is sign in
            case Screen.SIGN_UP: router.push("/"); break; // Home is sign in/up
            case Screen.HOME_CHAT: router.push("/dashboard" + queryString); break;
            case Screen.FORGOT_PASSWORD: router.push("/auth/forgot-password"); break;
            case Screen.RESET_LINK_SENT: router.push("/auth/reset-link-sent"); break;
            case Screen.SET_NEW_PASSWORD: router.push("/auth/set-new-password"); break;
            case Screen.PASSWORD_CHANGED: router.push("/auth/password-changed"); break;

            case Screen.PROFILE: router.push("/dashboard/profile" + queryString); break;
            case Screen.EDIT_PROFILE: router.push("/dashboard/edit-profile" + queryString); break;
            case Screen.GUEST_PROFILE: router.push("/dashboard/guest-profile" + queryString); break;
            case Screen.CONTRIBUTIONS: router.push("/dashboard/contributions" + queryString); break;
            case Screen.ADD_CONTRIBUTION: router.push("/dashboard/add-contribution" + queryString); break;
            case Screen.MESSAGES: router.push("/dashboard/feed" + queryString); break;
            case Screen.DM_LIST: router.push("/dashboard/messages" + queryString); break;
            case Screen.DIRECT_MESSAGE: router.push("/dashboard/direct-message" + queryString); break;
            case Screen.NOTIFICATIONS: router.push("/dashboard/notifications" + queryString); break;
            case Screen.SETTINGS: router.push("/dashboard/settings" + queryString); break;
            case Screen.SETTINGS_ACCOUNT: router.push("/dashboard/settings/account" + queryString); break;
            case Screen.SETTINGS_NOTIFICATIONS: router.push("/dashboard/settings/notifications" + queryString); break;
            case Screen.SETTINGS_PRIVACY: router.push("/dashboard/settings/privacy" + queryString); break;
            case Screen.MANAGE_LANGUAGES: router.push("/dashboard/settings/languages" + queryString); break;
            case Screen.SETTINGS_HELP: router.push("/dashboard/settings/help" + queryString); break;
            case Screen.SETTINGS_ABOUT: router.push("/dashboard/settings/about" + queryString); break;
            case Screen.SETTINGS_BLOCKED: router.push("/dashboard/settings/blocked" + queryString); break;
            case Screen.SETTINGS_MUTED: router.push("/dashboard/settings/muted" + queryString); break;
            case Screen.SETTINGS_DATA: router.push("/dashboard/settings/data" + queryString); break;

            case Screen.SAVED_CONVERSATIONS: router.push("/dashboard/saved-conversations" + queryString); break;
            case Screen.ALL_ACHIEVEMENTS: router.push("/dashboard/all-achievements" + queryString); break;
            case Screen.PEOPLE_TO_FOLLOW: router.push("/dashboard/people-to-follow" + queryString); break;
            case Screen.PROVERB_DETAIL: router.push("/dashboard/proverb-detail" + queryString); break;
            case Screen.STORY_DETAIL: router.push("/dashboard/story-detail" + queryString); break;
            case Screen.WORD_DETAIL: router.push("/dashboard/word-detail" + queryString); break;
            case Screen.POST_THREAD: router.push("/dashboard/post-thread" + queryString); break;
            case Screen.COMPOSE_POST: router.push("/dashboard/compose-post" + queryString); break;

            case Screen.MODERATION_DASHBOARD: router.push("/dashboard/moderation-dashboard" + queryString); break;
            case Screen.CHALLENGE_DETAILS: router.push("/dashboard/challenge-details" + queryString); break;
            case Screen.SUBMIT_ENTRY: router.push("/dashboard/submit-entry" + queryString); break;
            case Screen.ADD_CHALLENGE: router.push("/dashboard/add-challenge" + queryString); break;
            case Screen.SUGGEST_CHALLENGE: router.push("/dashboard/suggest-challenge" + queryString); break;
            case Screen.CHALLENGE_WINNERS: router.push("/dashboard/challenge-winners" + queryString); break;
            case Screen.CHALLENGE_CREATED: router.push("/dashboard/challenge-created" + queryString); break;
            case Screen.IDEA_SUBMITTED: router.push("/dashboard/idea-submitted" + queryString); break;
            case Screen.PASSWORD_CHANGED: router.push("/dashboard/password-changed" + queryString); break;
            case Screen.CHANGE_PASSWORD: router.push("/dashboard/change-password" + queryString); break;

            case Screen.VIDEO_CALL: router.push("/dashboard/video-call" + queryString); break;
            case Screen.VOICE_CALL: router.push("/dashboard/voice-call" + queryString); break;
            case Screen.CONTACT_INFO: router.push("/dashboard/contact-info" + queryString); break;
            case Screen.NEW_GROUP: router.push("/dashboard/new-group" + queryString); break;
            case Screen.NEW_CONTACT: router.push("/dashboard/new-contact" + queryString); break;
            case Screen.NEW_COMMUNITY: router.push("/dashboard/new-community" + queryString); break;
            case Screen.COMMUNITIES: router.push("/dashboard/communities" + queryString); break;
            case Screen.GROUP_VIEW: router.push("/dashboard/group-view" + queryString); break;

            case Screen.MODERATION_LOG: router.push("/dashboard/moderation-log" + queryString); break;
            case Screen.MODERATION_APPLICATION: router.push("/dashboard/moderation-application" + queryString); break;
            case Screen.COMMENTS: router.push("/dashboard/comments" + queryString); break;
            case Screen.MANAGE_ENTRIES: router.push("/dashboard/manage-entries" + queryString); break;
            case Screen.REVIEW_ENTRY: router.push("/dashboard/review-entry" + queryString); break;
            case Screen.SUGGEST_LINK: router.push("/dashboard/suggest-link" + queryString); break;

            // Fallback for screens not fully mapped yet - we'll implement dynamic routes later
            default:
                if (Object.values(Screen).includes(screen)) {
                    router.push(`/dashboard/${screen.toLowerCase().replace(/_/g, '-')}${queryString}`);
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
