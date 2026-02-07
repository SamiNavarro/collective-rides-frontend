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
import { toast } from '@/hooks/use-toast';

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
    staleTime: 0, // Always refetch on invalidation (important for leave/join actions)
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
    staleTime: 0, // Always refetch on invalidation (important for join/leave badge updates)
    refetchOnMount: 'always', // Always refetch when component mounts (ensures fresh data on navigation)
    retry: 2,
  });
};

/**
 * Get individual club details (for /clubs/[clubId] page)
 */
export const useClub = (clubId: string) => {
  return useQuery({
    queryKey: ['clubs', clubId, 'v3'], // Bust cache again
    queryFn: async (): Promise<ClubDetail> => {
      console.log('🔍 useClub: Fetching club:', clubId);
      const response = await api.clubs.get(clubId);
      console.log('📦 useClub: Full response:', JSON.stringify(response, null, 2));
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch club');
      }
      
      // Unwrap if needed (backend might still have cached Lambda)
      let clubData = response.data;
      if (clubData && typeof clubData === 'object' && 'data' in clubData && 'success' in clubData) {
        clubData = clubData.data;
      }
      
      console.log('✅ useClub: Final club data:', {
        id: clubData.id,
        name: clubData.name,
        hasMembership: !!clubData.userMembership,
        role: clubData.userMembership?.role,
        status: clubData.userMembership?.status,
      });
      
      return clubData as ClubDetail;
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
      const response = await api.clubs.listMembers(clubId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch club members');
      }
      // Handle both array and wrapped response
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      return data;
    },
    enabled: !!clubId,
    staleTime: 2 * 60 * 1000, // 2 minutes cache (member data changes more frequently)
    retry: 2,
  });
};

/**
 * Get club rides (for club detail page)
 * Fetches upcoming published rides for a specific club
 */
export const useClubRides = (clubId: string, options?: { enabled?: boolean; status?: 'published' | 'draft' }) => {
  const status = options?.status || 'published';
  
  return useQuery({
    queryKey: ['clubs', clubId, 'rides', status],
    queryFn: async () => {
      console.log('🔍 useClubRides: Fetching rides for club:', clubId, 'status:', status);
      const response = await api.rides.listForClub(clubId, { status });
      console.log('📦 useClubRides: Raw response:', JSON.stringify(response, null, 2));
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch club rides');
      }
      
      const allRides = Array.isArray(response.data) ? response.data : response.data?.data || [];
      console.log('📊 useClubRides: Extracted rides array:', allRides.length, 'rides');
      
      // Log first ride for debugging
      if (allRides.length > 0) {
        console.log('🔍 useClubRides: First ride sample:', JSON.stringify(allRides[0], null, 2));
      }
      
      // For published rides, filter for upcoming only and limit to 5
      if (status === 'published') {
        const upcomingRides = allRides
          .filter((ride: any) => {
            // Check if ride has required fields
            if (!ride.startDateTime) {
              console.warn(`⚠️ Ride "${ride.title}" missing startDateTime:`, ride);
              return false;
            }
            if (!ride.rideId && !ride.id) {
              console.warn(`⚠️ Ride "${ride.title}" missing rideId/id:`, ride);
              return false;
            }
            
            const startDate = new Date(ride.startDateTime);
            const isValid = !isNaN(startDate.getTime()) && startDate > new Date();
            console.log(`  Ride "${ride.title}": startDateTime=${ride.startDateTime}, valid=${isValid}`);
            return isValid; // Only valid future dates
          })
          .sort((a: any, b: any) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()) // Sort by date
          .slice(0, 5); // Limit to 5 rides
        console.log('✅ useClubRides: Returning', upcomingRides.length, 'upcoming rides');
        return upcomingRides;
      }
      
      // For draft rides, return all sorted by creation date (newest first)
      return allRides.sort((a: any, b: any) => 
        new Date(b.createdAt || b.startDateTime).getTime() - new Date(a.createdAt || a.startDateTime).getTime()
      );
    },
    enabled: !!clubId && (options?.enabled !== false),
    staleTime: 1 * 60 * 1000, // 1 minute cache (ride data changes frequently)
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
      
      // Show user-friendly error toast
      const errorMessage = error instanceof Error ? error.message : 'Failed to join club';
      
      if (errorMessage.includes('409') || errorMessage.includes('already')) {
        toast({
          title: 'Already a Member',
          description: 'You are already a member of this club.',
          variant: 'default',
        });
      } else if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to join this club.',
          variant: 'destructive',
        });
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast({
          title: 'Connection Error',
          description: 'Please check your internet connection and try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to Join Club',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
    onSuccess: (data, variables) => {
      console.log('🔄 useJoinClub: Invalidating queries after successful join...');
      console.log('   Membership status:', data.status);
      // Invalidate affected queries to trigger refetch with real data
      queryClient.invalidateQueries({ queryKey: ['users', 'me', 'clubs'] }); // My clubs
      queryClient.invalidateQueries({ queryKey: ['clubs', variables.clubId] }); // Club detail
      queryClient.invalidateQueries({ queryKey: ['clubs', 'discovery'], exact: false }); // Discovery list (all filter variations)
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
      queryClient.invalidateQueries({ queryKey: ['clubs', 'discovery'], exact: false }); // Discovery list (all filter variations)
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'members'] }); // Club members
    },
    onError: (error) => {
      console.error('❌ useLeaveClub: Mutation error:', error);
      
      // Show user-friendly error toast
      const errorMessage = error instanceof Error ? error.message : 'Failed to leave club';
      
      if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
        toast({
          title: 'Cannot Leave Club',
          description: 'You do not have permission to leave this club.',
          variant: 'destructive',
        });
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast({
          title: 'Connection Error',
          description: 'Please check your internet connection and try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to Leave Club',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });
};

/**
 * Update club mutation (Phase 3.4)
 */
export const useUpdateClub = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      clubId, 
      data 
    }: { 
      clubId: string; 
      data: any;
    }) => {
      const response = await api.clubs.update(clubId, data);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update club');
      }
      return response.data;
    },
    onSuccess: (data, { clubId }) => {
      // Invalidate club detail and lists
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'me', 'clubs'] });
      
      toast({
        title: 'Club Updated',
        description: 'Club settings have been saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Update Club',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Get club members with filters (Phase 3.4)
 */
export const useClubMembersFiltered = (
  clubId: string, 
  options?: { status?: string; role?: string; enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['clubs', clubId, 'members', options],
    queryFn: async (): Promise<ClubMember[]> => {
      const response = await api.clubs.listMembers(clubId, {
        status: options?.status,
        role: options?.role,
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch members');
      }
      // Handle both array and wrapped response
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      return data;
    },
    enabled: !!clubId && (options?.enabled !== false),
    staleTime: 1 * 60 * 1000, // 1 minute cache
    retry: 2,
  });
};

/**
 * Update member role mutation (Phase 3.4)
 */
export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      clubId, 
      userId, 
      role,
      reason 
    }: { 
      clubId: string; 
      userId: string; 
      role: string;
      reason?: string;
    }) => {
      const response = await api.clubs.updateMember(clubId, userId, { role, reason });
      if (!response.success) {
        throw new Error(response.error || 'Failed to update member role');
      }
      return response.data;
    },
    onSuccess: (data, { clubId }) => {
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'members'] });
      
      toast({
        title: 'Member Role Updated',
        description: 'Member role has been changed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Update Role',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Remove member mutation (Phase 3.4)
 */
export const useRemoveMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      clubId, 
      userId,
      reason 
    }: { 
      clubId: string; 
      userId: string; 
      reason?: string;
    }) => {
      const response = await api.clubs.removeMember(clubId, userId, { reason });
      if (!response.success) {
        throw new Error(response.error || 'Failed to remove member');
      }
      return response.data;
    },
    onSuccess: (data, { clubId }) => {
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'members'] });
      
      toast({
        title: 'Member Removed',
        description: 'Member has been removed from the club.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Remove Member',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Process join request mutation (Phase 3.4)
 */
export const useProcessJoinRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      clubId, 
      membershipId,
      action,
      message 
    }: { 
      clubId: string; 
      membershipId: string;
      action: 'approve' | 'reject';
      message?: string;
    }) => {
      const response = await api.clubs.processJoinRequest(clubId, membershipId, { action, message });
      if (!response.success) {
        throw new Error(response.error || 'Failed to process request');
      }
      return response.data;
    },
    onSuccess: (data, { clubId, action }) => {
      // Invalidate both pending and active member lists
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'members'] });
      
      toast({
        title: action === 'approve' ? 'Request Approved' : 'Request Rejected',
        description: action === 'approve' 
          ? 'Member has been added to the club.' 
          : 'Join request has been rejected.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Process Request',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
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