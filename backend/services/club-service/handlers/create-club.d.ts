/**
 * Create Club Handler - Phase 2.1
 *
 * Lambda handler for POST /clubs endpoint.
 * Admin endpoint for creating new clubs (SiteAdmin only).
 *
 * Compliance:
 * - Phase 2.1 Spec: .kiro/specs/phase-2.1.club-service.v1.md
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Lambda handler for POST /clubs
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export declare function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
