"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background-light to-background-dark p-4">
      <div className="w-full max-w-md">
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-white dark:bg-[#1a1612] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl",
              headerTitle: "text-2xl font-black text-stone-900 dark:text-white",
              headerSubtitle: "text-stone-600 dark:text-stone-400",
              formFieldLabel: "text-stone-700 dark:text-stone-300 font-medium",
              formFieldInput: "bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:ring-2 focus:ring-primary/50",
              formButtonPrimary: "bg-primary hover:bg-primary/90 text-white font-bold rounded-lg",
              footerActionLink: "text-primary hover:text-primary/80 font-medium",
              dividerLine: "bg-stone-200 dark:bg-stone-700",
              dividerText: "text-stone-500 dark:text-stone-400",
              socialButtonsBlockButton: "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg",
              socialButtonsBlockButtonText: "text-stone-700 dark:text-stone-300 font-medium",
              formFieldInputShowPasswordButton: "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300",
              footer: "bg-transparent",
              footerAction: "bg-transparent",
            },
            variables: {
              colorPrimary: "#ea580c",
              colorTextOnPrimaryBackground: "#ffffff",
              colorBackground: "#ffffff",
              colorInputBackground: "#fafaf9",
              colorInputText: "#1c1917",
              borderRadius: "0.75rem",
              fontFamily: "inherit",
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
