const authConfig = {
  providers: [
    {
      // The Clerk frontend API domain. Set NEXT_PUBLIC_CLERK_FRONTEND_API_URL
      // in the environment that runs `npx convex dev`.
      domain: process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
