/**
 * List User Invitations Handler - Phase 2.2
 *
 * Lambda handler for GET /v1/users/me/invitations endpoint.
 * Returns the authenticated user's pending invitations.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Lambda handler for GET /v1/users/me/invitations
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export declare function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
