/**
 * Update User Handler - Phase 1.2
 *
 * Lambda handler for PUT /users/{id} endpoint.
 * Implements user profile updates with proper authorization as defined
 * in the canonical specification.
 *
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Lambda handler for PUT /users/{id}
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export declare function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
