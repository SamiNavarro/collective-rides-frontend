/**
 * Ride-related React Query hooks - Phase 3.3
 * 
 * Custom hooks for ride data fetching using React Query.
 * Supports ride listing, detail, and participation actions.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/api-client';
import { 
  RideSummary, 
  RideDetail, 
  RideFilters,
  UpdateRideRequest
} from '@/lib/types/rides';
import { toast } from '@/hooks/use-toast';

/**
 * Get rides for multiple clubs (Phase 3.3.1)
 * Fetches rides from all user's active clubs and merges them
 */
export const useRides = (clubIds: string[], filters?: RideFilters) => {
  return useQuery({
    queryKey: ['rides', clubIds, filters],
    queryFn: async (): Promise<RideSummary[]> => {
      if (clubIds.length === 0) {
        return [];
      }

      // Fetch rides for each club in parallel
      const ridePromises = clubIds.map(clubId => 
        api.rides.listForClub(clubId, {
          status: 'published',
          startDate: filters?.startDate || new Date().toISOString(),
          limit: 50,
        })
      );
      
      const results = await Promise.all(ridePromises);
      
      // Merge and sort by startDateTime
      const allRides = results.flatMap(r => {
        // API client returns { success, data: apiResponse }
        // API response is { success, data: rides[] }
        if (!r.success || !r.data || !Array.isArray(r.data.data)) {
          return [];
        }
        return r.data.data;
      });
      
      return allRides.sort((a, b) => 
        new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
      );
    },
    enabled: clubIds.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute cache
    retry: 2,
  });
};

/**
 * Get ride detail (Phase 3.3.2)
 */
export const useRide = (clubId: string, rideId: string) => {
  return useQuery({
    queryKey: ['clubs', clubId, 'rides', rideId],
    queryFn: async (): Promise<RideDetail> => {
      const response = await api.rides.get(clubId, rideId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch ride');
      }
      // API client returns { success, data: apiResponse }
      // API response is { success, data: rideDetail }
      return response.data.data || response.data;
    },
    enabled: !!clubId && !!rideId,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    retry: 2,
  });
};

/**
 * Join ride mutation (Phase 3.3.2)
 */
export const useJoinRide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ clubId, rideId }: { clubId: string; rideId: string }) => {
      const response = await api.rides.join(clubId, rideId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to join ride');
      }
      return response.data;
    },
    onSuccess: (data, { clubId, rideId }) => {
      // Invalidate ride detail and ride lists
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'rides', rideId] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      
      toast({
        title: 'Joined Ride',
        description: 'You have successfully joined this ride.',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join ride';
      
      if (errorMessage.includes('409') || errorMessage.includes('already')) {
        toast({
          title: 'Already Joined',
          description: 'You are already a participant in this ride.',
          variant: 'default',
        });
      } else if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to join this ride.',
          variant: 'destructive',
        });
      } else if (errorMessage.includes('full') || errorMessage.includes('capacity')) {
        toast({
          title: 'Ride Full',
          description: 'This ride has reached maximum capacity.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to Join Ride',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });
};

/**
 * Leave ride mutation (Phase 3.3.2)
 */
export const useLeaveRide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      clubId, 
      rideId 
    }: { 
      clubId: string; 
      rideId: string; 
    }) => {
      const response = await api.rides.leave(clubId, rideId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to leave ride');
      }
      return response.data;
    },
    // Optimistically update the UI before the request completes
    onMutate: async ({ clubId, rideId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['clubs', clubId, 'rides', rideId] });
      
      // Snapshot the previous value
      const previousRide = queryClient.getQueryData(['clubs', clubId, 'rides', rideId]);
      
      // Optimistically update to remove viewer participation
      queryClient.setQueryData(['clubs', clubId, 'rides', rideId], (old: any) => {
        if (!old?.data?.data) return old;
        
        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...old.data.data,
              viewerParticipation: null,
              currentParticipants: Math.max(0, (old.data.data.currentParticipants || 1) - 1),
              participants: old.data.data.participants?.filter((p: any) => !p.isViewer) || []
            }
          }
        };
      });
      
      // Return context with the snapshot
      return { previousRide };
    },
    onSuccess: (data, { clubId, rideId }) => {
      // Refetch to get the actual server state
      queryClient.invalidateQueries({ 
        queryKey: ['clubs', clubId, 'rides', rideId],
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      
      toast({
        title: 'Left Ride',
        description: 'You have successfully left this ride.',
      });
    },
    onError: (error, { clubId, rideId }, context: any) => {
      // Rollback to the previous value on error
      if (context?.previousRide) {
        queryClient.setQueryData(['clubs', clubId, 'rides', rideId], context.previousRide);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to leave ride';
      
      if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
        toast({
          title: 'Cannot Leave Ride',
          description: 'You do not have permission to leave this ride.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to Leave Ride',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });
};

/**
 * Create ride mutation (Phase 3.3.3)
 */
export const useCreateRide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      clubId, 
      data 
    }: { 
      clubId: string; 
      data: any 
    }) => {
      const response = await api.rides.create(clubId, data);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create ride');
      }
      return { ride: response.data.data || response.data, clubId };
    },
    onSuccess: ({ ride, clubId }) => {
      // Invalidate ride lists
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'rides'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      
      toast({
        title: ride.status === 'published' ? 'Ride Published' : 'Draft Saved',
        description: ride.status === 'published' 
          ? 'Your ride is now visible to all club members.'
          : 'Your ride draft has been saved. Publish it to make it visible to members.',
      });
      
      // Return ride data for navigation
      return ride;
    },
    onError: (error) => {
      toast({
        title: 'Failed to Create Ride',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Publish ride mutation (Phase 3.3.3)
 */
export const usePublishRide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      clubId, 
      rideId 
    }: { 
      clubId: string; 
      rideId: string 
    }) => {
      const response = await api.rides.publish(clubId, rideId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to publish ride');
      }
      return response.data;
    },
    onSuccess: (data, { clubId, rideId }) => {
      // Invalidate ride detail and lists
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'rides', rideId] });
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'rides'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      
      toast({
        title: 'Ride Published',
        description: 'Your ride is now visible to all club members.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Publish Ride',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Update ride mutation (Phase 3.3.4)
 */
export const useUpdateRide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      clubId, 
      rideId, 
      data 
    }: { 
      clubId: string; 
      rideId: string; 
      data: UpdateRideRequest 
    }) => {
      const response = await api.rides.update(clubId, rideId, data);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update ride');
      }
      return response.data;
    },
    onSuccess: (data, { clubId, rideId }) => {
      // Invalidate ride detail and lists
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'rides', rideId] });
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'rides'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      
      toast({
        title: 'Ride Updated',
        description: 'Your changes have been saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Update Ride',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Cancel ride mutation (Phase 3.3.4)
 */
export const useCancelRide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      clubId, 
      rideId, 
      reason 
    }: { 
      clubId: string; 
      rideId: string; 
      reason?: string 
    }) => {
      const response = await api.rides.cancel(clubId, rideId, { reason });
      if (!response.success) {
        throw new Error(response.error || 'Failed to cancel ride');
      }
      return response.data;
    },
    onSuccess: (data, { clubId, rideId }) => {
      // Invalidate ride detail and lists
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'rides', rideId] });
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'rides'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      
      toast({
        title: 'Ride Cancelled',
        description: 'Ride cancelled. Members will see the updated status.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Cancel Ride',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
};
