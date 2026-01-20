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
      console.log('🔍 useMyClubs: Fetching clubs...');
      const response = await api.user.getClubs();
      console.log('📦 useMyClubs: Full response:', JSON.stringify(response, null, 2));
      
      if (!response.success) {
        console.error('❌ useMyClubs: API returned error:', response.error);
        throw new Error(response.error || 'Failed to fetch clubs');
      }
      
      console.log('📊 useMyClubs: response.data type:', typeof response.data);
      console.log('📊 useMyClubs: response.data is array?', Array.isArray(response.data));
      console.log('📊 useMyClubs: response.data keys:', response.data ? Object.keys(response.data) : 'null');
      
      // Handle array response (correct format)
      if (Array.isArray(response.data)) {
        console.log('✅ useMyClubs: Got array with', response.data.length, 'clubs');
        return response.data;
      }
      
      // Handle empty object (user has no clubs)
      if (response.data && typeof response.data === 'object') {
        const keys = Object.keys(response.data);
        console.log('📊 useMyClubs: response.data has keys:', keys);
        
        // Check for nested data (double-wrapping)
        if ('data' in response.data) {
          console.log('🔄 useMyClubs: Found nested data, unwrapping...');
          const nested = response.data.data;
          if (Array.isArray(nested)) {
            console.log('✅ useMyClubs: Nested data is array with', nested.length, 'clubs');
            return nested as MyClubMembership[];
          }
        }
        
        // Empty object means no clubs
        if (keys.length === 0) {
          console.log('ℹ️ useMyClubs: Empty object, user has no clubs');
          return [];
        }
      }
      
      console.warn('⚠️ useMyClubs: Unexpected response format, returning empty array');
      return [];
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
      return response.data; // Single unwrap (response.data is the array)
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
      return response.data; // Single unwrap (response.data is the club object)
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
      return response.data; // Single unwrap (response.data is the array)
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
      console.log('🚀 useJoinClub: Joining club:', clubId);
      const response = await api.clubs.join(clubId, data);
      console.log('📦 useJoinClub: Response:', response);
      if (!response.success) {
        throw new Error(response.error || 'Failed to join club');
      }
      console.log('✅ useJoinClub: Successfully joined, status:', response.data.status);
      return response.data;
    },
    onMutate: async ({ clubId }) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['clubs', clubId] });
      await queryClient.cancelQueries({ queryKey: ['clubs', 'discovery'] });
      
      // Snapshot previous values
      const previousClub = queryClient.getQueryData(['clubs', clubId]);
      const previousDiscovery = queryClient.getQueryData(['clubs', 'discovery']);
      
      // Optimistically update club detail to show active status (instant activation)
      queryClient.setQueryData(['clubs', clubId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          userMembership: {
            role: 'member',
            status: 'active',
          }
        };
      });
      
      // Optimistically update discovery list to show active badge
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
                    status: 'active' 
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
      console.log('🔄 useJoinClub: Invalidating queries after successful join...');
      console.log('   Membership status:', data.status);
      // Invalidate affected queries to trigger refetch with real data
      queryClient.invalidateQueries({ queryKey: ['users', 'me', 'clubs'] }); // My clubs
      queryClient.invalidateQueries({ queryKey: ['clubs', variables.clubId] }); // Club detail
      queryClient.invalidateQueries({ queryKey: ['clubs', 'discovery'] }); // Discovery list
      queryClient.invalidateQueries({ queryKey: ['clubs', variables.clubId, 'members'] }); // Club members
      console.log('✅ useJoinClub: Queries invalidated');
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
      console.log('🚪 useLeaveClub: Leaving club:', clubId);
      const response = await api.clubs.leave(clubId);
      console.log('📦 useLeaveClub: Response:', response);
      
      if (!response.success) {
        console.error('❌ useLeaveClub: API error:', response.error, 'Status:', response.statusCode);
        throw new Error(response.error || 'Failed to leave club');
      }
      
      console.log('✅ useLeaveClub: Successfully left club');
      return response.data;
    },
    onSuccess: (data, clubId) => {
      console.log('🔄 useLeaveClub: Invalidating queries...');
      // Invalidate affected queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['users', 'me', 'clubs'] }); // My clubs
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId] }); // Club detail
      queryClient.invalidateQueries({ queryKey: ['clubs', 'discovery'] }); // Discovery list
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'members'] }); // Club members
    },
    onError: (error) => {
      console.error('❌ useLeaveClub: Mutation error:', error);
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
      return response.data; // Single unwrap (response.data is the array)
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
};