'use client';

import { AuthGuard } from "@/components/auth-guard";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return <AuthGuard requireAuth={true}>{children}</AuthGuard>;
} 