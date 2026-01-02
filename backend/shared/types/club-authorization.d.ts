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
export { ClubRole } from './membership';
export { AuthContext } from './auth';
/**
 * Club-level capability enumeration
 */
export declare enum ClubCapability {
    VIEW_CLUB_DETAILS = "view_club_details",
    VIEW_PUBLIC_MEMBERS = "view_public_members",
    LEAVE_CLUB = "leave_club",
    VIEW_CLUB_MEMBERS = "view_club_members",
    INVITE_MEMBERS = "invite_members",
    REMOVE_MEMBERS = "remove_members",
    MANAGE_JOIN_REQUESTS = "manage_join_requests",
    MANAGE_CLUB_CONTENT = "manage_club_content",
    MANAGE_CLUB_SETTINGS = "manage_club_settings",
    MANAGE_ADMINS = "manage_admins",
    VIEW_CLUB_RIDES = "view_club_rides",
    JOIN_RIDES = "join_rides",
    CREATE_RIDE_PROPOSALS = "create_ride_proposals",
    VIEW_DRAFT_RIDES = "view_draft_rides",
    PUBLISH_OFFICIAL_RIDES = "publish_official_rides",
    MANAGE_RIDES = "manage_rides",
    CANCEL_RIDES = "cancel_rides",
    MANAGE_PARTICIPANTS = "manage_participants",
    ASSIGN_LEADERSHIP = "assign_leadership",
    UPLOAD_ROUTE_FILES = "upload_route_files",
    DOWNLOAD_ROUTE_FILES = "download_route_files",
    MANAGE_FILE_VERSIONS = "manage_file_versions",
    VIEW_ROUTE_ANALYTICS = "view_route_analytics",
    CREATE_ROUTE_TEMPLATES = "create_route_templates",
    MANAGE_CLUB_TEMPLATES = "manage_club_templates",
    VIEW_CLUB_TEMPLATES = "view_club_templates"
}
/**
 * Role-capability mapping
 */
export declare const ROLE_CAPABILITIES: Record<ClubRole, ClubCapability[]>;
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
export declare function getCapabilitiesForRole(role: ClubRole): ClubCapability[];
/**
 * Check if role has capability
 */
export declare function roleHasCapability(role: ClubRole, capability: ClubCapability): boolean;
/**
 * Get minimum role required for capability
 */
export declare function getMinimumRoleForCapability(capability: ClubCapability): ClubRole | null;
/**
 * Get all roles that have a capability
 */
export declare function getRolesWithCapability(capability: ClubCapability): ClubRole[];
