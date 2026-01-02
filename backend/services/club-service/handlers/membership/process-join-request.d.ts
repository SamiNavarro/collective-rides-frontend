/**
 * Process Join Request Handler - Phase 2.2
 *
 * Lambda handler for PUT /v1/clubs/{id}/requests/{membershipId} endpoint.
 * Allows club admins to approve or reject join requests.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Lambda handler for PUT /v1/clubs/{id}/requests/{membershipId}
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export declare function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
