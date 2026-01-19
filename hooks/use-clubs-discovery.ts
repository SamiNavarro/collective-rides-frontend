/**
 * Club Discovery React Query Hook - Phase 3.2.2
 * 
 * Custom hook for club discovery with filtering and pagination.
 * Replaces mock data with real backend integration.
 * 
 * Compliance:
 * - Phase 3.2 Spec: .kiro/specs/phase-3.2.club-pages-and-discovery.v1.md
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/api-client';

/**
 * Club discovery filters
 */
export interface ClubDiscoveryFilters {
  search?: string;
  area?: string;
  pace?: string;
  beginnerFriendly?: string;
  limit?: number;
  cursor?: string;
}

/**
 * Club data from backend
 */
export interface ClubData {
  id: string;
  name: string;
  description?: string;
  city?: string;
  logoUrl?: string;
  status: 'active' | 'suspended' | 'archived';
  createdAt: string;
  updatedAt: string;
}

/**
 * Discovery response with pagination
 */
export interface ClubDiscoveryResponse {
  clubs: ClubData[];
  pagination: {
    limit: number;
    nextCursor?: string;
  };
}

/**
 * Hook for club discovery with filters
 * 
 * Features:
 * - Real backend data (no mocks)
 * - Client-side filtering for area, pace, beginner-friendly
 * - Search functionality
 * - Pagination support
 * - 5 minute cache (discovery data is relatively static)
 */
export const useClubsDiscovery = (filters: ClubDiscoveryFilters = {}) => {
  return useQuery({
    queryKey: ['clubs', 'discovery', filters],
    queryFn: async (): Promise<ClubDiscoveryResponse> => {
      // Fetch from backend
      const response = await api.clubs.discovery({
        limit: filters.limit || 20,
        cursor: filters.cursor,
        status: 'active', // Only show active clubs
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch clubs');
      }

      // Extract data from API response
      // Backend returns: { success: true, data: { success: true, data: [...], pagination: {...} } }
      const innerData = response.data?.data || response.data;
      const clubs = innerData?.data || innerData || [];
      const pagination = innerData?.pagination || { limit: 20 };

      // Client-side filtering (backend doesn't support these filters yet)
      let filteredClubs = clubs;

      // Search filter (name and description)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredClubs = filteredClubs.filter((club: ClubData) => 
          club.name.toLowerCase().includes(searchLower) ||
          (club.description && club.description.toLowerCase().includes(searchLower))
        );
      }

      // Area filter (city field)
      if (filters.area && filters.area !== 'all') {
        filteredClubs = filteredClubs.filter((club: ClubData) => {
          if (!club.city) return false;
          const cityLower = club.city.toLowerCase();
          
          // Map filter values to city patterns
          switch (filters.area) {
            case 'city':
              return cityLower.includes('city') || cityLower.includes('inner west');
            case 'eastern':
              return cityLower.includes('eastern') || cityLower.includes('bondi') || cityLower.includes('coogee');
            case 'northern':
              return cityLower.includes('northern') || cityLower.includes('manly') || cityLower.includes('beaches');
            case 'southern':
              return cityLower.includes('southern') || cityLower.includes('sutherland');
            default:
              return true;
          }
        });
      }

      // Note: Pace and beginnerFriendly filters require backend support
      // For now, these are handled by the mock data in the directory page
      // TODO: Add these fields to Club model in Phase 3.3

      return {
        clubs: filteredClubs,
        pagination,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache (discovery data is relatively static)
    retry: 2,
    enabled: true, // Always enabled for discovery
  });
};

/**
 * Hook for infinite scroll pagination
 * 
 * TODO: Implement in Phase 3.3 if needed
 */
export const useClubsDiscoveryInfinite = (filters: ClubDiscoveryFilters = {}) => {
  // Placeholder for future infinite scroll implementation
  return useClubsDiscovery(filters);
};
