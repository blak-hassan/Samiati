"use client";
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Globe,
  UserCircle,
  User as UserIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import SamiatiLogo from '../SamiatiLogo';

interface Props {
  onSignIn: () => void;
  onSignUp?: () => void;
  onGuest: () => void;
  onForgotPassword: () => void;
  onGoogleSignIn: () => void;
  onFacebookSignIn: () => void;
}

const WelcomeScreen: React.FC<Props> = ({
  onSignIn,
  onSignUp,
  onGuest,
  onForgotPassword,
  onGoogleSignIn,
  onFacebookSignIn
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
      if (mode === 'signin') {
        onSignIn();
      } else if (onSignUp) {
        onSignUp();
      } else {
        onSignIn(); // Fallback
      }
    }, 1500);
  };

  const handleSocialClick = (platform: 'google' | 'facebook') => {
    setSocialLoading(platform);
    setTimeout(() => {
      setSocialLoading(null);
      if (platform === 'google') onGoogleSignIn();
      else onFacebookSignIn();
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background relative overflow-hidden font-body">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full px-6 py-8 relative z-10">
        <div className="flex justify-center mb-8">
          <SamiatiLogo size={80} className="scale-110" />
        </div>

        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[32px] p-8 shadow-2xl shadow-primary/5">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight text-foreground mb-2 leading-tight">
              {mode === 'signin' ? 'Sign in to Samiati' : 'Join Samiati today'}
            </h1>
            {mode === 'signup' && (
              <p className="text-muted-foreground text-sm font-medium">
                Preserve history, share stories, and connect.
              </p>
            )}
          </div>

          {/* Social Auth Section - Prioritized */}
          <div className="space-y-3 mb-8">
            <Button
              variant="outline"
              type="button"
              disabled={isLoading || !!socialLoading}
              onClick={() => handleSocialClick('google')}
              className="w-full h-12 rounded-full gap-3 border-border hover:bg-white hover:text-black dark:hover:bg-white dark:hover:text-black font-bold transition-all relative overflow-hidden bg-white/50 dark:bg-black/20"
            >
              {socialLoading === 'google' ? (
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <>
                  <Globe className="w-5 h-5 text-primary" />
                  <span>{mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              type="button"
              disabled={isLoading || !!socialLoading}
              onClick={() => handleSocialClick('facebook')}
              className="w-full h-12 rounded-full gap-3 border-border hover:bg-white hover:text-black dark:hover:bg-white dark:hover:text-black font-bold transition-all relative overflow-hidden bg-white/50 dark:bg-black/20"
            >
              {socialLoading === 'facebook' ? (
                <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <>
                  <UserCircle className="w-5 h-5 text-blue-600" />
                  <span>{mode === 'signin' ? 'Sign in with Facebook' : 'Sign up with Facebook'}</span>
                </>
              )}
            </Button>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
              <span className="bg-card px-4 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="relative">
                  <UserIcon className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="fullname"
                    type="text"
                    placeholder="Full Name"
                    className="pl-12 h-12 rounded-xl bg-background/50 border-border/50 focus:bg-background transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Email Address"
                  className="pl-12 h-12 rounded-xl bg-background/50 border-border/50 focus:bg-background transition-all placeholder:text-muted-foreground/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="pl-12 pr-12 h-12 rounded-xl bg-background/50 border-border/50 focus:bg-background transition-all placeholder:text-muted-foreground/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !!socialLoading}
              className="w-full h-12 rounded-full text-base font-bold shadow-xl shadow-primary/20 mt-2 group transition-all"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <span>{mode === 'signin' ? 'Next' : 'Create account'}</span>
              )}
            </Button>

            {mode === 'signin' && (
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-sm font-bold text-foreground hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </form>

          {/* New Footer Toggle */}
          <div className="mt-8 pt-6 border-t border-border/30">
            <p className="text-muted-foreground text-sm font-medium text-center">
              {mode === 'signin' ? "Don't have an account?" : "Have an account already?"}{" "}
              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-primary font-bold hover:text-primary-hover-heritage ml-1 hover:underline transition-colors"
              >
                {mode === 'signin' ? "Sign up" : "Log in"}
              </button>
            </p>
          </div>
        </div>

        {/* Guest Option */}
        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            onClick={onGuest}
            className="text-muted-foreground hover:text-foreground font-bold rounded-xl h-10 transition-colors text-sm"
          >
            Explore as Guest
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
