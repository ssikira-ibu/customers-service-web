"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * AuthGuard component that handles redirecting users based on authentication state
 * - For login/signup pages: redirects authenticated users to dashboard
 * - For protected pages: redirects unauthenticated users to login
 */
export function AuthGuard({
  children,
  redirectTo = "/dashboard",
  requireAuth = false,
}: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Don't redirect while auth state is loading

    if (requireAuth && !user) {
      // Redirect unauthenticated users to login
      router.replace("/login");
      return;
    }

    if (!requireAuth && user) {
      // Redirect authenticated users away from auth pages
      router.replace(redirectTo);
      return;
    }
  }, [user, loading, router, redirectTo, requireAuth]);

  // Show loading spinner while auth state is loading
  if (loading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
          <span className="text-sm text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Don't render children while redirecting
  if (requireAuth && !user) return null;
  if (!requireAuth && user) return null;

  return <>{children}</>;
}
