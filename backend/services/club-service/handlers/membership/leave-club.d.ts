/**
 * Leave Club Handler - Phase 2.2
 *
 * Lambda handler for DELETE /v1/clubs/{id}/members/me endpoint.
 * Allows authenticated users to leave clubs voluntarily.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Lambda handler for DELETE /v1/clubs/{id}/members/me
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export declare function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
