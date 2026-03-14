"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface AuthSocialButtonsProps {
  onSignInClick: () => void;
  onSignUpClick: () => void;
  onGuestClick: () => void;
  onForgotPasswordClick: () => void;
}

export function AuthSocialButtons({
  onSignInClick,
  onSignUpClick,
  onGuestClick,
  onForgotPasswordClick,
}: AuthSocialButtonsProps) {
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    if (!signInLoaded || !signIn) return;
    
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/dashboard",
        redirectUrlComplete: "/dashboard",
      });
    } catch (error) {
      console.error("Google sign in error:", error);
    }
  };

  const handleFacebookSignIn = async () => {
    if (!signInLoaded || !signIn) return;
    
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_facebook",
        redirectUrl: "/dashboard",
        redirectUrlComplete: "/dashboard",
      });
    } catch (error) {
      console.error("Facebook sign in error:", error);
    }
  };

  return {
    handleGoogleSignIn,
    handleFacebookSignIn,
    handleEmailSignIn: onSignInClick,
    handleEmailSignUp: onSignUpClick,
    handleGuest: onGuestClick,
    handleForgotPassword: onForgotPasswordClick,
  };
}

// Hook to get auth state and methods
export function useAuthNavigation() {
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const router = useRouter();

  const signInWithGoogle = async () => {
    if (!signInLoaded || !signIn) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/dashboard",
        redirectUrlComplete: "/dashboard",
      });
    } catch (error) {
      console.error("Google sign in error:", error);
    }
  };

  const signInWithFacebook = async () => {
    if (!signInLoaded || !signIn) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_facebook",
        redirectUrl: "/dashboard",
        redirectUrlComplete: "/dashboard",
      });
    } catch (error) {
      console.error("Facebook sign in error:", error);
    }
  };

  const signInWithEmail = () => {
    router.push("/sign-in");
  };

  const signUpWithEmail = () => {
    router.push("/sign-up");
  };

  const signInAsGuest = () => {
    router.push("/dashboard");
  };

  const goToForgotPassword = () => {
    router.push("/forgot-password");
  };

  return {
    signInWithGoogle,
    signInWithFacebook,
    signInWithEmail,
    signUpWithEmail,
    signInAsGuest,
    goToForgotPassword,
    isReady: signInLoaded,
  };
}
