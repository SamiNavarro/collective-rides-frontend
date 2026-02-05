/**
 * Get Club Handler - Phase 2.1 + Phase 3.4 Enhancement
 *
 * Lambda handler for GET /clubs/{id} endpoint.
 * Public endpoint for retrieving club details by ID.
 * Enhanced to include user membership information when authenticated.
 *
 * Compliance:
 * - Phase 2.1 Spec: .kiro/specs/phase-2.1.club-service.v1.md
 * - Phase 3.4 Enhancement: Include userMembership for management UI
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Lambda handler for GET /clubs/{id}
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export declare function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
