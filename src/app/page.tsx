"use client";

import WelcomeScreen from '@/components/screens/WelcomeScreen';
import { useNavigation } from '@/hooks/useNavigation';
import { Screen } from '@/types';

export default function Home() {
  const { navigate } = useNavigation();

  const handleSignIn = () => {
    // In a real app, this would involve auth logic.
    // For now, we just navigate to the dashboard.
    navigate(Screen.HOME_CHAT);
  };

  const handleGuest = () => {
    navigate(Screen.HOME_CHAT);
  };

  const handleForgotPassword = () => {
    navigate(Screen.FORGOT_PASSWORD);
  };

  const handleSocialSignIn = () => {
    navigate(Screen.HOME_CHAT);
  };

  return (
    <WelcomeScreen
      onSignIn={handleSignIn}
      onSignUp={handleSignIn}
      onGuest={handleGuest}
      onForgotPassword={handleForgotPassword}
      onGoogleSignIn={handleSocialSignIn}
      onFacebookSignIn={handleSocialSignIn}
    />
  );
}
