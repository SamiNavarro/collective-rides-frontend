import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.statusCode >= 400 && error?.statusCode < 500) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
    },
    mutations: {
      retry: false,
    },
  },
})