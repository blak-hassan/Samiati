import type { Metadata } from 'next';
import { OnboardingFlow } from '@/components/public/OnboardingFlow';

export const metadata: Metadata = {
  title: 'Welcome · Samiati',
  description: 'Choose your language and find your starting point with Samiati.',
};

export default function OnboardingPage() {
  return <OnboardingFlow />;
}
