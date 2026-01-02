/**
 * Remove Member Handler - Phase 2.2
 *
 * Lambda handler for DELETE /v1/clubs/{id}/members/{userId} endpoint.
 * Allows club admins to remove members from clubs.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Lambda handler for DELETE /v1/clubs/{id}/members/{userId}
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export declare function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
