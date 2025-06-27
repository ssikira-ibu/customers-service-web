import useSWR from 'swr';
import { userAPI, User, APIError } from '../api';

// Hook for fetching current user
export function useUser() {
  const { data, error, isLoading, mutate: refreshUser } = useSWR<User>(
    'user',
    () => userAPI.getCurrentUser(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 60000, // Refresh every minute
    }
  );

  return {
    user: data,
    isLoading,
    error: error as APIError | null,
    refreshUser,
  };
} 