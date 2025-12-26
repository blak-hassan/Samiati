'use client';

import { useNavigation } from '@/hooks/useNavigation';
import ModerationLogScreen from '@/components/screens/ModerationLogScreen';

export default function ModerationLogPage() {
    const { navigate, goBack } = useNavigation();

    return <ModerationLogScreen navigate={navigate} goBack={goBack} />;
}
