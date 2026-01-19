/**
 * Club-related React Query hooks - Phase 3.1
 * 
 * Custom hooks for club data fetching using React Query.
 * Includes the new hydrated endpoint to eliminate "Unknown Club" issues.
 * 
 * Compliance:
 * - Phase 3.1 Spec: .kiro/specs/phase-3.1.club-navigation-foundations.v1.md
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/api-client';
import { 
  MyClubMembership, 
  ClubDiscovery, 
  ClubDetail, 
  ClubMember,
  JoinClubRequest,
  ApiResponse,
  PaginatedResponse 
} from '@/lib/types/clubs';

/**
 * Mock data for development testing
 */
const mockClubData: MyClubMembership[] = [
  {
    clubId: 'sydney-cycling-club',
    clubName: 'Sydney Cycling Club',
    clubSlug: 'sydney-cycling-club',
    clubLocation: 'City & Inner West',
    clubAvatarUrl: '/sydney-cycling-club-racing-team.png',
    memberCount: 450,
    membershipRole: 'member',
    membershipStatus: 'active',
    joinedAt: '2024-01-15T00:00:00Z',
  },
  {
    clubId: 'eastern-suburbs-cycling',
    clubName: 'Eastern Suburbs Cycling Club',
    clubSlug: 'eastern-suburbs-cycling',
    clubLocation: 'Eastern Suburbs',
    clubAvatarUrl: '/eastern-suburbs-cycling-club-coastal.png',
    memberCount: 280,
    membershipRole: 'admin',
    membershipStatus: 'active',
    joinedAt: '2024-02-20T00:00:00Z',
  },
];

/**
 * Get user's clubs with hydrated data (Phase 3.1)
 * This replaces separate membership + club API calls
 */
export const useMyClubs = () => {
  return useQuery({
    queryKey: ['users', 'me', 'clubs'],
    queryFn: async (): Promise<MyClubMembership[]> => {
      // Development mode: Use mock data if API fails
      if (process.env.NODE_ENV === 'development') {
        try {
          const response = await api.user.getClubs();
          if (!response.success) {
            console.warn('API call failed, using mock data for development:', response.error);
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));
            return mockClubData;
          }
          return response.data.data; // Unwrap the API response
        } catch (error) {
          console.warn('Network error, using mock data for development:', error);
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 500));
          return mockClubData;
        }
      } else {
        // Production mode: Fail if API doesn't work
        const response = await api.user.getClubs();
        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch clubs');
        }
        return response.data.data; // Unwrap the API response
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes cache (more dynamic than discovery)
    retry: 2,
  });
};

/**
 * Get club discovery data (for /directory page)
 */
export const useClubDiscovery = (params?: { status?: string; city?: string }) => {
  return useQuery({
    queryKey: ['clubs', 'discovery', params],
    queryFn: async (): Promise<ClubDiscovery[]> => {
      const response = await api.clubs.list();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch clubs');
      }
      return response.data.data; // Unwrap the API response
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache (less dynamic)
    retry: 2,
  });
};

/**
 * Get individual club details (for /clubs/[clubId] page)
 */
export const useClub = (clubId: string) => {
  return useQuery({
    queryKey: ['clubs', clubId],
    queryFn: async (): Promise<ClubDetail> => {
      const response = await api.clubs.get(clubId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch club');
      }
      return response.data.data; // Unwrap the API response
    },
    enabled: !!clubId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 2,
  });
};

/**
 * Get club members (for club detail page)
 */
export const useClubMembers = (clubId: string) => {
  return useQuery({
    queryKey: ['clubs', clubId, 'members'],
    queryFn: async (): Promise<ClubMember[]> => {
      const response = await api.clubs.getMembers(clubId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch club members');
      }
      return response.data.data; // Unwrap the API response
    },
    enabled: !!clubId,
    staleTime: 2 * 60 * 1000, // 2 minutes cache (member data changes more frequently)
    retry: 2,
  });
};

/**
 * Join club mutation with optimistic updates
 */
export const useJoinClub = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ clubId, data }: { clubId: string; data: JoinClubRequest }) => {
      const response = await api.clubs.join(clubId, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to join club');
      }
      return response.data;
    },
    onMutate: async ({ clubId }) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['clubs', clubId] });
      await queryClient.cancelQueries({ queryKey: ['clubs', 'discovery'] });
      
      // Snapshot previous values
      const previousClub = queryClient.getQueryData(['clubs', clubId]);
      const previousDiscovery = queryClient.getQueryData(['clubs', 'discovery']);
      
      // Optimistically update club detail to show pending status
      queryClient.setQueryData(['clubs', clubId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          userMembership: {
            role: 'member',
            status: 'pending',
          }
        };
      });
      
      // Optimistically update discovery list to show pending badge
      queryClient.setQueryData(['clubs', 'discovery'], (old: any) => {
        if (!old?.clubs) return old;
        return {
          ...old,
          clubs: old.clubs.map((club: any) => 
            club.id === clubId 
              ? { 
                  ...club, 
                  userMembership: { 
                    role: 'member', 
                    status: 'pending' 
                  } 
                }
              : club
          )
        };
      });
      
      return { previousClub, previousDiscovery };
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousClub) {
        queryClient.setQueryData(['clubs', variables.clubId], context.previousClub);
      }
      if (context?.previousDiscovery) {
        queryClient.setQueryData(['clubs', 'discovery'], context.previousDiscovery);
      }
      console.error('Failed to join club:', error);
    },
    onSuccess: (data, variables) => {
      // Invalidate affected queries to trigger refetch with real data
      queryClient.invalidateQueries({ queryKey: ['users', 'me', 'clubs'] }); // My clubs
      queryClient.invalidateQueries({ queryKey: ['clubs', variables.clubId] }); // Club detail
      queryClient.invalidateQueries({ queryKey: ['clubs', 'discovery'] }); // Discovery list
      queryClient.invalidateQueries({ queryKey: ['clubs', variables.clubId, 'members'] }); // Club members
    },
  });
};

/**
 * Leave club mutation
 */
export const useLeaveClub = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (clubId: string) => {
      const response = await api.clubs.leave(clubId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to leave club');
      }
      return response.data;
    },
    onSuccess: (data, clubId) => {
      // Invalidate affected queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['users', 'me', 'clubs'] }); // My clubs
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId] }); // Club detail
      queryClient.invalidateQueries({ queryKey: ['clubs', 'discovery'] }); // Discovery list
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'members'] }); // Club members
    },
    onError: (error) => {
      console.error('Failed to leave club:', error);
    },
  });
};

/**
 * Legacy hook for backward compatibility (Phase 2.2)
 * This will be deprecated in favor of useMyClubs
 */
export const useMyMemberships = () => {
  return useQuery({
    queryKey: ['users', 'me', 'memberships'],
    queryFn: async () => {
      const response = await api.user.getMemberships();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch memberships');
      }
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
};