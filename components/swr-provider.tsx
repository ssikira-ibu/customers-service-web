"use client"

import { SWRConfig } from 'swr'
import { handleAPIError } from '@/lib/utils/api-utils'

interface SWRProviderProps {
  children: React.ReactNode
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // Global error handler
        onError: (error) => {
          handleAPIError(error)
        },
        // Global loading state
        loadingTimeout: 3000,
        // Retry configuration
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        // Focus revalidation
        revalidateOnFocus: false,
        // Reconnection revalidation
        revalidateOnReconnect: true,
        // Deduplication
        dedupingInterval: 2000,
        // Keep previous data while revalidating
        keepPreviousData: true,
      }}
    >
      {children}
    </SWRConfig>
  )
} 