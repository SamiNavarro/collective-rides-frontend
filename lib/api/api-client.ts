/**
 * API Client with Cognito JWT Authentication
 * 
 * Provides a centralized API client that automatically handles:
 * - JWT token attachment
 * - Token refresh
 * - Error handling
 * - Request/response transformation
 */

import { cognitoAuth } from '../auth/cognito-service';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  requireAuth?: boolean;
}

export class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL!;
    
    if (!this.baseUrl) {
      throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
    }
  }

  /**
   * Make authenticated API request
   */
  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      headers = {},
      requireAuth = true,
    } = options;

    try {
      // Prepare headers
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
      };

      // Add authentication if required
      if (requireAuth) {
        const idToken = await cognitoAuth.getIdToken();
        console.log('🔐 API Client: Getting token for request', {
          endpoint,
          hasToken: !!idToken,
          tokenLength: idToken?.length,
        });
        if (!idToken) {
          console.error('❌ API Client: No token available!');
          return {
            success: false,
            error: 'Authentication required',
            statusCode: 401,
          };
        }
        requestHeaders.Authorization = `Bearer ${idToken}`;
      }

      // Make request
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      // Parse response
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      // Handle response
      if (response.ok) {
        return {
          success: true,
          data: responseData,
          statusCode: response.status,
        };
      } else {
        // Handle authentication errors
        if (response.status === 401) {
          // Token might be expired, try to refresh
          if (requireAuth) {
            const refreshed = await cognitoAuth.refreshTokens();
            if (refreshed) {
              // Retry request with new token
              return this.request(endpoint, options);
            } else {
              // Refresh failed, user needs to login again
              await cognitoAuth.signOut();
            }
          }
        }

        return {
          success: false,
          error: this.getErrorMessage(responseData, response.status),
          statusCode: response.status,
        };
      }
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
        statusCode: 0,
      };
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, requireAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', requireAuth });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body?: any, requireAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, requireAuth });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body?: any, requireAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, requireAuth });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options?: { data?: any; requireAuth?: boolean }): Promise<ApiResponse<T>> {
    const requireAuth = options?.requireAuth !== undefined ? options.requireAuth : true;
    return this.request<T>(endpoint, { 
      method: 'DELETE', 
      body: options?.data,
      requireAuth 
    });
  }

  /**
   * Health check (no auth required)
   */
  async healthCheck(): Promise<ApiResponse> {
    return this.get('/health', false);
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(responseData: any, statusCode: number): string {
    // Try to extract error message from response
    if (typeof responseData === 'object') {
      if (responseData.error) {
        return responseData.error;
      }
      if (responseData.message) {
        return responseData.message;
      }
    }

    // Fallback to status code messages
    switch (statusCode) {
      case 400:
        return 'Bad request. Please check your input.';
      case 401:
        return 'Authentication required. Please sign in.';
      case 403:
        return 'Access denied. You do not have permission.';
      case 404:
        return 'Resource not found.';
      case 409:
        return 'Conflict. The resource already exists.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return `Request failed with status ${statusCode}`;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Convenience methods for common API calls
export const api = {
  // User endpoints
  user: {
    getCurrent: () => apiClient.get('/v1/users/me'),
    update: (data: any) => apiClient.put('/v1/users/me', data),
    getMemberships: () => apiClient.get('/v1/users/me/memberships'),
    getClubs: (status?: 'active' | 'pending' | 'suspended') => {
      const params = status ? `?status=${status}` : '';
      return apiClient.get(`/v1/users/me/clubs${params}`);
    }, // Phase 3.1: Hydrated clubs with optional status filter
  },

  // Club endpoints
  clubs: {
    list: () => apiClient.get('/v1/clubs', false), // Public endpoint
    discovery: (params?: { limit?: number; cursor?: string; status?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.cursor) queryParams.append('cursor', params.cursor);
      if (params?.status) queryParams.append('status', params.status);
      const queryString = queryParams.toString();
      return apiClient.get(`/v1/clubs${queryString ? `?${queryString}` : ''}`, false);
    },
    get: (id: string) => apiClient.get(`/v1/clubs/${id}`), // Send auth if available (optional auth)
    create: (data: any) => apiClient.post('/v1/clubs', data),
    update: (id: string, data: any) => apiClient.put(`/v1/clubs/${id}`, data),
    join: (id: string, data: any) => apiClient.post(`/v1/clubs/${id}/members`, data),
    leave: (id: string) => apiClient.delete(`/v1/clubs/${id}/members/me`, { requireAuth: true }),
    // Member management (Phase 3.4)
    listMembers: (id: string, params?: { status?: string; role?: string; limit?: number; cursor?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.role) queryParams.append('role', params.role);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.cursor) queryParams.append('cursor', params.cursor);
      const queryString = queryParams.toString();
      return apiClient.get(`/v1/clubs/${id}/members${queryString ? `?${queryString}` : ''}`);
    },
    updateMember: (clubId: string, userId: string, data: { role: string; reason?: string }) => 
      apiClient.put(`/v1/clubs/${clubId}/members/${userId}`, data),
    removeMember: (clubId: string, userId: string, data?: { reason?: string }) => 
      apiClient.delete(`/v1/clubs/${clubId}/members/${userId}`, { data }),
    processJoinRequest: (clubId: string, membershipId: string, data: { action: string; message?: string }) => 
      apiClient.put(`/v1/clubs/${clubId}/requests/${membershipId}`, data),
  },

  // Ride endpoints (Phase 3.3)
  rides: {
    // List rides for a specific club
    listForClub: (clubId: string, params?: { status?: string; startDate?: string; limit?: number; cursor?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.cursor) queryParams.append('cursor', params.cursor);
      const queryString = queryParams.toString();
      return apiClient.get(`/v1/clubs/${clubId}/rides${queryString ? `?${queryString}` : ''}`);
    },
    // Get ride detail
    get: (clubId: string, rideId: string) => apiClient.get(`/v1/clubs/${clubId}/rides/${rideId}`),
    // Create ride (Phase 3.3.3)
    create: (clubId: string, data: any) => apiClient.post(`/v1/clubs/${clubId}/rides`, data),
    // Update ride (Phase 3.3.4)
    update: (clubId: string, rideId: string, data: any) => apiClient.put(`/v1/clubs/${clubId}/rides/${rideId}`, data),
    // Publish ride (Phase 3.3.3)
    publish: (clubId: string, rideId: string) => apiClient.post(`/v1/clubs/${clubId}/rides/${rideId}/publish`, {}),
    // Cancel ride (Phase 3.3.4)
    cancel: (clubId: string, rideId: string, data: { reason?: string }) => apiClient.delete(`/v1/clubs/${clubId}/rides/${rideId}`, { data }),
    // Join ride (Phase 3.3.2)
    join: (clubId: string, rideId: string, data?: any) => apiClient.post(`/v1/clubs/${clubId}/rides/${rideId}/join`, data || {}),
    // Leave ride
    leave: (clubId: string, rideId: string) => apiClient.delete(`/v1/clubs/${clubId}/rides/${rideId}/participants/me`, { requireAuth: true }),
  },

  // Strava endpoints
  strava: {
    connect: () => apiClient.get('/integrations/strava/connect'),
    disconnect: () => apiClient.delete('/integrations/strava/disconnect', { requireAuth: true }),
  },

  // Health check
  health: () => apiClient.healthCheck(),
};