/**
 * Join Club Handler - Phase 2.2
 *
 * Lambda handler for POST /v1/clubs/{id}/members endpoint.
 * Allows authenticated users to join clubs.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Lambda handler for POST /v1/clubs/{id}/members
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export declare function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
