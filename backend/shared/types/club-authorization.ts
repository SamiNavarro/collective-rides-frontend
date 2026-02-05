/**
 * Club Authorization Types - Phase 2.2
 * 
 * Type definitions for club-level authorization, capabilities, and role-based access control.
 * Extends Phase 1.3 authorization with club-specific permissions.
 * 
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */

import { ClubRole } from './membership';
import { AuthContext } from './auth';

// Re-export for convenience
export { ClubRole } from './membership';
export { AuthContext } from './auth';

/**
 * Club-level capability enumeration
 */
export enum ClubCapability {
  // Member capabilities
  VIEW_CLUB_DETAILS = 'view_club_details',
  VIEW_PUBLIC_MEMBERS = 'view_public_members',
  LEAVE_CLUB = 'leave_club',
  
  // Admin capabilities
  VIEW_CLUB_MEMBERS = 'view_club_members',
  INVITE_MEMBERS = 'invite_members',
  REMOVE_MEMBERS = 'remove_members',
  MANAGE_JOIN_REQUESTS = 'manage_join_requests',
  MANAGE_CLUB_CONTENT = 'manage_club_content',
  
  // Owner capabilities (Phase 2.2 limited scope)
  MANAGE_CLUB_SETTINGS = 'manage_club_settings',
  MANAGE_ADMINS = 'manage_admins',
  
  // Ride capabilities (Phase 2.3)
  VIEW_CLUB_RIDES = 'view_club_rides',
  JOIN_RIDES = 'join_rides',
  CREATE_RIDE_PROPOSALS = 'create_ride_proposals',
  VIEW_DRAFT_RIDES = 'view_draft_rides',
  PUBLISH_OFFICIAL_RIDES = 'publish_official_rides',
  MANAGE_RIDES = 'manage_rides',
  CANCEL_RIDES = 'cancel_rides',
  MANAGE_PARTICIPANTS = 'manage_participants',
  ASSIGN_LEADERSHIP = 'assign_leadership',
  
  // Route file capabilities (Phase 2.4 MVP)
  UPLOAD_ROUTE_FILES = 'upload_route_files',
  DOWNLOAD_ROUTE_FILES = 'download_route_files',
  MANAGE_FILE_VERSIONS = 'manage_file_versions',
  VIEW_ROUTE_ANALYTICS = 'view_route_analytics',
  CREATE_ROUTE_TEMPLATES = 'create_route_templates',
  MANAGE_CLUB_TEMPLATES = 'manage_club_templates',
  VIEW_CLUB_TEMPLATES = 'view_club_templates',
  
  // Future capabilities (out of scope for current phases)
  // TRANSFER_OWNERSHIP = 'transfer_ownership',
  // DELETE_CLUB = 'delete_club',
  // DELETE_ROUTE_FILES = 'delete_route_files',
  // EXPORT_ROUTE_DATA = 'export_route_data',
  // SHARE_ROUTES_EXTERNALLY = 'share_routes_externally',
  // ACCESS_PREMIUM_ANALYTICS = 'access_premium_analytics',
  // BULK_ROUTE_OPERATIONS = 'bulk_route_operations',
}

/**
 * Role-capability mapping
 */
export const ROLE_CAPABILITIES: Record<ClubRole, ClubCapability[]> = {
  [ClubRole.MEMBER]: [
    ClubCapability.VIEW_CLUB_DETAILS,
    ClubCapability.VIEW_PUBLIC_MEMBERS,
    ClubCapability.LEAVE_CLUB,
    // Ride capabilities (Phase 2.3)
    ClubCapability.VIEW_CLUB_RIDES,
    ClubCapability.JOIN_RIDES,
    ClubCapability.CREATE_RIDE_PROPOSALS,
    // Route file capabilities (Phase 2.4 MVP)
    ClubCapability.DOWNLOAD_ROUTE_FILES,
    ClubCapability.VIEW_ROUTE_ANALYTICS,
    ClubCapability.VIEW_CLUB_TEMPLATES,
  ],
  [ClubRole.CAPTAIN]: [
    // Inherits all member capabilities
    ClubCapability.VIEW_CLUB_DETAILS,
    ClubCapability.VIEW_PUBLIC_MEMBERS,
    ClubCapability.LEAVE_CLUB,
    ClubCapability.VIEW_CLUB_RIDES,
    ClubCapability.JOIN_RIDES,
    ClubCapability.CREATE_RIDE_PROPOSALS,
    ClubCapability.DOWNLOAD_ROUTE_FILES,
    ClubCapability.VIEW_ROUTE_ANALYTICS,
    ClubCapability.VIEW_CLUB_TEMPLATES,
    // Captain-specific ride capabilities (Phase 2.3)
    ClubCapability.VIEW_DRAFT_RIDES,
    ClubCapability.PUBLISH_OFFICIAL_RIDES,
    ClubCapability.MANAGE_RIDES,
    ClubCapability.MANAGE_PARTICIPANTS,
    // Route file captain capabilities (Phase 2.4 MVP)
    ClubCapability.UPLOAD_ROUTE_FILES,
    ClubCapability.CREATE_ROUTE_TEMPLATES,
  ],
  [ClubRole.ADMIN]: [
    // Inherits all member capabilities
    ClubCapability.VIEW_CLUB_DETAILS,
    ClubCapability.VIEW_PUBLIC_MEMBERS,
    ClubCapability.LEAVE_CLUB,
    ClubCapability.VIEW_CLUB_RIDES,
    ClubCapability.JOIN_RIDES,
    ClubCapability.CREATE_RIDE_PROPOSALS,
    ClubCapability.DOWNLOAD_ROUTE_FILES,
    ClubCapability.VIEW_ROUTE_ANALYTICS,
    // Admin-specific capabilities
    ClubCapability.VIEW_CLUB_MEMBERS,
    ClubCapability.INVITE_MEMBERS,
    ClubCapability.REMOVE_MEMBERS,
    ClubCapability.MANAGE_JOIN_REQUESTS,
    ClubCapability.MANAGE_CLUB_CONTENT,
    // Ride admin capabilities (Phase 2.3)
    ClubCapability.VIEW_DRAFT_RIDES,
    ClubCapability.PUBLISH_OFFICIAL_RIDES,
    ClubCapability.MANAGE_RIDES,
    ClubCapability.CANCEL_RIDES,
    ClubCapability.MANAGE_PARTICIPANTS,
    ClubCapability.ASSIGN_LEADERSHIP,
    // Route file admin capabilities (Phase 2.4 MVP)
    ClubCapability.UPLOAD_ROUTE_FILES,
    ClubCapability.MANAGE_FILE_VERSIONS,
    ClubCapability.CREATE_ROUTE_TEMPLATES,
    ClubCapability.MANAGE_CLUB_TEMPLATES,
  ],
  [ClubRole.OWNER]: [
    // Inherits all admin capabilities
    ClubCapability.VIEW_CLUB_DETAILS,
    ClubCapability.VIEW_PUBLIC_MEMBERS,
    ClubCapability.LEAVE_CLUB,
    ClubCapability.VIEW_CLUB_MEMBERS,
    ClubCapability.INVITE_MEMBERS,
    ClubCapability.REMOVE_MEMBERS,
    ClubCapability.MANAGE_JOIN_REQUESTS,
    ClubCapability.MANAGE_CLUB_CONTENT,
    ClubCapability.VIEW_CLUB_RIDES,
    ClubCapability.JOIN_RIDES,
    ClubCapability.CREATE_RIDE_PROPOSALS,
    ClubCapability.VIEW_DRAFT_RIDES,
    ClubCapability.PUBLISH_OFFICIAL_RIDES,
    ClubCapability.MANAGE_RIDES,
    ClubCapability.CANCEL_RIDES,
    ClubCapability.MANAGE_PARTICIPANTS,
    ClubCapability.ASSIGN_LEADERSHIP,
    ClubCapability.DOWNLOAD_ROUTE_FILES,
    ClubCapability.VIEW_ROUTE_ANALYTICS,
    ClubCapability.UPLOAD_ROUTE_FILES,
    ClubCapability.MANAGE_FILE_VERSIONS,
    ClubCapability.CREATE_ROUTE_TEMPLATES,
    ClubCapability.MANAGE_CLUB_TEMPLATES,
    // Owner-specific capabilities
    ClubCapability.MANAGE_CLUB_SETTINGS,
    ClubCapability.MANAGE_ADMINS,
  ],
};

/**
 * Enhanced authorization context with club membership
 */
export interface ClubAuthContext extends AuthContext {
  clubMembership?: {
    membershipId: string;
    clubId: string;
    role: ClubRole;
    status: string;
    joinedAt: string;
  };
  clubCapabilities: ClubCapability[];
}

/**
 * Club authorization error details
 */
export interface ClubAuthorizationError {
  capability: ClubCapability;
  clubId: string;
  userId: string;
  userRole?: ClubRole;
  requiredRoles: ClubRole[];
}

/**
 * Get capabilities for a club role
 */
export function getCapabilitiesForRole(role: ClubRole): ClubCapability[] {
  return ROLE_CAPABILITIES[role] || [];
}

/**
 * Check if role has capability
 */
export function roleHasCapability(role: ClubRole, capability: ClubCapability): boolean {
  return getCapabilitiesForRole(role).includes(capability);
}

/**
 * Get minimum role required for capability
 */
export function getMinimumRoleForCapability(capability: ClubCapability): ClubRole | null {
  for (const [role, capabilities] of Object.entries(ROLE_CAPABILITIES)) {
    if (capabilities.includes(capability)) {
      return role as ClubRole;
    }
  }
  return null;
}

/**
 * Get all roles that have a capability
 */
export function getRolesWithCapability(capability: ClubCapability): ClubRole[] {
  return Object.entries(ROLE_CAPABILITIES)
    .filter(([_, capabilities]) => capabilities.includes(capability))
    .map(([role, _]) => role as ClubRole);
}