'use client';

import { useNavigation } from '@/hooks/useNavigation';
import ModeratorApplicationScreen from '@/components/screens/ModeratorApplicationScreen';

export default function ModerationApplicationPage() {
    const { navigate, goBack } = useNavigation();

    return <ModeratorApplicationScreen navigate={navigate} goBack={goBack} />;
}
