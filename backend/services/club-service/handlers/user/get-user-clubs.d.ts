/**
 * Get User Clubs Handler - Phase 3.1
 *
 * Lambda handler for GET /v1/users/me/clubs endpoint.
 * Returns hydrated club membership data to eliminate "Unknown Club" issues.
 *
 * Compliance:
 * - Phase 3.1 Spec: .kiro/specs/phase-3.1.club-navigation-foundations.v1.md
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Hydrated club membership data (Phase 3.1 spec)
 */
export interface MyClubMembership {
    clubId: string;
    clubName: string;
    clubSlug: string;
    clubLocation?: string;
    clubAvatarUrl?: string;
    memberCount?: number;
    membershipRole: 'member' | 'admin' | 'owner';
    membershipStatus: 'active' | 'pending' | 'suspended';
    joinedAt: string;
}
/**
 * Lambda handler for GET /v1/users/me/clubs
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result with hydrated club data
 */
export declare function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
