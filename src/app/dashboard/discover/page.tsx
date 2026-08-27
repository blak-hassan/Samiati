"use client";

import { useNavigation } from "@/hooks/useNavigation";
import { DiscoverScreen } from "@/components/screens/DiscoverScreen";

export default function DiscoverPage() {
  const { navigate } = useNavigation();
  return <DiscoverScreen navigate={navigate} />;
}
