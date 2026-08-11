"use client";

import HomeSearchScreen from '@/components/screens/HomeSearchScreen';
import { useNavigation } from '@/hooks/useNavigation';

export default function Home() {
  const { navigate } = useNavigation();

  return (
    <HomeSearchScreen
      navigate={navigate}
      unreadCount={0}
    />
  );
}
