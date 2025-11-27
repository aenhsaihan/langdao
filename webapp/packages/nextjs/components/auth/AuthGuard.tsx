"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean; // If true, redirect to home if no account. If false, just wait for auth check.
}

/**
 * AuthGuard component that prevents rendering children until authentication state is determined.
 * This prevents flicker from showing content before auth checks complete.
 */
export const AuthGuard = ({ children, requireAuth = false }: AuthGuardProps) => {
  const account = useActiveAccount();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [hasCheckedAccount, setHasCheckedAccount] = useState(false);

  // Wait for account state to be determined
  useEffect(() => {
    // Mark that we've started checking
    setHasCheckedAccount(true);

    // Give a small delay to allow account state to settle
    // This prevents flicker from showing content before auth check completes
    const timer = setTimeout(() => {
      setIsCheckingAuth(false);
    }, 150); // 150ms should be enough for account state to initialize

    return () => clearTimeout(timer);
  }, []);

  // If account state changes after initial check, we can show content immediately
  useEffect(() => {
    if (hasCheckedAccount && account !== undefined) {
      // Account state is now determined, we can show content
      setIsCheckingAuth(false);
    }
  }, [account, hasCheckedAccount]);

  // If auth check is still in progress, show loading screen
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <span className="text-2xl">🔍</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loading...</h2>
          <p className="text-gray-600 dark:text-gray-300">Checking your connection...</p>
        </div>
      </div>
    );
  }

  // If auth is required but no account, redirect to home
  if (requireAuth && !account) {
    router.push("/");
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Redirecting...</h2>
          <p className="text-gray-600 dark:text-gray-300">Please connect your wallet to continue</p>
        </div>
      </div>
    );
  }

  // Auth check complete, render children
  return <>{children}</>;
};
