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
  ArrowRight,
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

      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full px-6 py-12 relative z-10">
        <div className="flex justify-center mb-12">
          <SamiatiLogo size={100} className="scale-110" />
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight text-foreground mb-3 leading-tight">
            {mode === 'signin' ? 'Welcome Back' : 'Join the Community'}
          </h1>
          <p className="text-muted-foreground text-lg font-medium px-4">
            {mode === 'signin'
              ? 'Your gateway to African cultural heritage.'
              : 'Preserve history, share stories, and connect.'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl shadow-primary/5">
          <div className="bg-muted/50 rounded-2xl p-1 flex mb-8">
            <button
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300",
                mode === 'signin'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setMode('signin')}
            >
              Sign In
            </button>
            <button
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300",
                mode === 'signup'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setMode('signup')}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="fullname" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Full Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="fullname"
                    type="text"
                    placeholder="Abioye Okafor"
                    className="pl-12 h-14 rounded-2xl bg-background/50 border-border/50 focus:bg-background transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-12 h-14 rounded-2xl bg-background/50 border-border/50 focus:bg-background transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</Label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-xs text-primary font-bold hover:text-primary-hover-heritage transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-12 pr-12 h-14 rounded-2xl bg-background/50 border-border/50 focus:bg-background transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !!socialLoading}
              className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 mt-4 group transition-all"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50"></div>
            </div>
            <div className="relative flex justify-center text-xs font-bold uppercase tracking-wider">
              <span className="bg-card px-4 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              type="button"
              disabled={isLoading || !!socialLoading}
              onClick={() => handleSocialClick('google')}
              className="h-14 rounded-2xl gap-3 border-border/50 hover:bg-muted/50 font-bold transition-all relative overflow-hidden"
            >
              {socialLoading === 'google' ? (
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <>
                  <Globe className="w-5 h-5 text-primary" />
                  <span>Google</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              type="button"
              disabled={isLoading || !!socialLoading}
              onClick={() => handleSocialClick('facebook')}
              className="h-14 rounded-2xl gap-3 border-border/50 hover:bg-muted/50 font-bold transition-all relative overflow-hidden"
            >
              {socialLoading === 'facebook' ? (
                <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <>
                  <UserCircle className="w-5 h-5 text-blue-600" />
                  <span>Facebook</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="mt-10 text-center flex flex-col gap-2">
          <Button
            variant="ghost"
            onClick={onGuest}
            className="text-muted-foreground hover:text-foreground font-bold rounded-xl h-12 transition-colors"
          >
            Explore as Guest
          </Button>
          <p className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-[0.2em] mt-4">
            Preserving African Heritage • Samiati v1.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;