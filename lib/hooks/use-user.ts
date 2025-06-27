import useSWR from 'swr';
import { userAPI, User, APIError } from '../api';
import { useAuth } from '@/components/auth-provider';

// Hook for fetching current user
export function useUser() {
  const { user: authUser, loading: authLoading } = useAuth();
  
  const { data, error, isLoading, mutate: refreshUser } = useSWR<User>(
    // Only fetch when user is authenticated
    authUser ? 'user' : null,
    () => userAPI.getCurrentUser(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 60000, // Refresh every minute
    }
  );

  return {
    user: data,
    isLoading: authLoading || isLoading,
    error: error as APIError | null,
    refreshUser,
  };
} 