import { RideCapability } from '../../../../shared/types/ride-authorization';
import { ClubRole, AuthContext } from '../../../../shared/types/club-authorization';
import { RideStatus, RideScope } from '../../../../shared/types/ride';
import { InsufficientPrivilegesError } from '../../../../shared/authorization/authorization-errors';

export class RideAuthorizationService {
  private static readonly ROLE_CAPABILITIES: Record<ClubRole, RideCapability[]> = {
    [ClubRole.MEMBER]: [
      RideCapability.VIEW_CLUB_RIDES,
      RideCapability.JOIN_RIDES,
      RideCapability.CREATE_RIDE_PROPOSALS
    ],
    [ClubRole.CAPTAIN]: [
      RideCapability.VIEW_CLUB_RIDES,
      RideCapability.JOIN_RIDES,
      RideCapability.CREATE_RIDE_PROPOSALS,
      RideCapability.VIEW_DRAFT_RIDES,
      RideCapability.PUBLISH_OFFICIAL_RIDES,
      RideCapability.MANAGE_PARTICIPANTS
    ],
    [ClubRole.ADMIN]: [
      RideCapability.VIEW_CLUB_RIDES,
      RideCapability.JOIN_RIDES,
      RideCapability.CREATE_RIDE_PROPOSALS,
      RideCapability.VIEW_DRAFT_RIDES,
      RideCapability.PUBLISH_OFFICIAL_RIDES,
      RideCapability.MANAGE_PARTICIPANTS,
      RideCapability.MANAGE_RIDES,
      RideCapability.CANCEL_RIDES,
      RideCapability.ASSIGN_LEADERSHIP
    ],
    [ClubRole.OWNER]: [
      ...Object.values(RideCapability)
    ]
  };

  static async requireRideCapability(
    capability: RideCapability,
    authContext: AuthContext,
    clubId: string,
    rideId?: string,
    rideCreatedBy?: string
  ): Promise<void> {
    // System admin override
    if (authContext.systemCapabilities?.includes('MANAGE_ALL_CLUBS')) {
      return;
    }

    // Check club membership and role
    const membership = authContext.clubMemberships?.find((m: any) => m.clubId === clubId);
    if (!membership || membership.status !== 'active') {
      throw new InsufficientPrivilegesError(capability, authContext.userId, `club:${clubId}`);
    }

    // Get capabilities for user's club role
    const roleCapabilities = this.ROLE_CAPABILITIES[membership.role as ClubRole] || [];
    
    // Special case: ride creator can manage their own draft rides
    if (rideCreatedBy === authContext.userId && 
        (capability === RideCapability.MANAGE_RIDES || capability === RideCapability.CANCEL_RIDES)) {
      return;
    }

    // Check if user has required capability
    if (!roleCapabilities.includes(capability)) {
      throw new InsufficientPrivilegesError(capability, authContext.userId, `club:${clubId}`);
    }
  }

  static canViewRide(
    authContext: AuthContext,
    clubId: string,
    rideStatus: RideStatus,
    rideScope: RideScope,
    rideCreatedBy: string,
    isPublic: boolean
  ): boolean {
    // System admin can view all rides
    if (authContext.systemCapabilities?.includes('MANAGE_ALL_CLUBS')) {
      return true;
    }

    // Public rides are viewable by anyone (read-only)
    if (isPublic && rideStatus === RideStatus.PUBLISHED) {
      return true;
    }

    // Phase 2.3: Only club rides supported
    if (rideScope !== RideScope.CLUB) {
      return false;
    }

    // Check club membership
    const membership = authContext.clubMemberships?.find((m: any) => m.clubId === clubId);
    if (!membership || membership.status !== 'active') {
      return false;
    }

    // Draft rides: only creator and leadership can view
    if (rideStatus === RideStatus.DRAFT) {
      if (rideCreatedBy === authContext.userId) {
        return true;
      }
      
      const roleCapabilities = this.ROLE_CAPABILITIES[membership.role as ClubRole] || [];
      return roleCapabilities.includes(RideCapability.VIEW_DRAFT_RIDES);
    }

    // Published rides: all club members can view
    return true;
  }

  static canPublishRide(authContext: AuthContext, clubId: string): boolean {
    // System admin can publish any ride
    if (authContext.systemCapabilities?.includes('MANAGE_ALL_CLUBS')) {
      return true;
    }

    const membership = authContext.clubMemberships?.find((m: any) => m.clubId === clubId);
    if (!membership || membership.status !== 'active') {
      return false;
    }

    const roleCapabilities = this.ROLE_CAPABILITIES[membership.role as ClubRole] || [];
    return roleCapabilities.includes(RideCapability.PUBLISH_OFFICIAL_RIDES);
  }

  static getUserRideCapabilities(authContext: AuthContext, clubId: string): RideCapability[] {
    // System admin has all capabilities
    if (authContext.systemCapabilities?.includes('MANAGE_ALL_CLUBS')) {
      return Object.values(RideCapability);
    }

    const membership = authContext.clubMemberships?.find((m: any) => m.clubId === clubId);
    if (!membership || membership.status !== 'active') {
      return [];
    }

    return this.ROLE_CAPABILITIES[membership.role as ClubRole] || [];
  }
}