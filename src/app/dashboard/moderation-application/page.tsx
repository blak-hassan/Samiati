'use client';

import { useNavigation } from '@/hooks/useNavigation';
import ModeratorApplicationScreen from '@/components/screens/ModeratorApplicationScreen';

export default function ModerationApplicationPage() {
    const { navigate, goBack } = useNavigation();

    // TODO: Get actual user ID from Clerk/Convex when integrated
    const userId = 'mock-user-id';

    return <ModeratorApplicationScreen navigate={navigate} goBack={goBack} userId={userId} />;
}
