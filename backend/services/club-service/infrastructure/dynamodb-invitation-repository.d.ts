/**
 * DynamoDB Invitation Repository - Phase 2.2
 *
 * DynamoDB implementation of the invitation repository interface.
 * Uses single-table design with dual invitation system support.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ClubInvitation, CreateInvitationInput, ProcessInvitationInput, ListInvitationsOptions, ListInvitationsResult } from '../../../shared/types/invitation';
import { IInvitationRepository } from '../domain/invitation/invitation-repository';
/**
 * DynamoDB invitation repository implementation
 */
export declare class DynamoDBInvitationRepository implements IInvitationRepository {
    private dynamoClient;
    private tableName;
    constructor(tableName?: string, dynamoClient?: DynamoDBClient);
    /**
     * Get invitation by ID
     */
    getInvitationById(invitationId: string): Promise<ClubInvitation | null>;
    /**
     * Get invitation by token (for email invitations)
     */
    getInvitationByToken(token: string): Promise<ClubInvitation | null>;
    /**
     * List user's pending invitations
     */
    listUserInvitations(userId: string, options: ListInvitationsOptions): Promise<ListInvitationsResult>;
    /**
     * Create a new invitation
     */
    createInvitation(input: CreateInvitationInput, clubId: string, invitedBy: string): Promise<ClubInvitation>;
    /**
     * Process invitation (accept/decline)
     */
    processInvitation(invitationId: string, input: ProcessInvitationInput, userId?: string): Promise<ClubInvitation>;
    /**
     * Cancel invitation (admin action)
     */
    cancelInvitation(invitationId: string): Promise<ClubInvitation>;
    /**
     * Check if user has pending invitation to club
     */
    hasPendingInvitation(clubId: string, userId?: string, email?: string): Promise<boolean>;
    /**
     * Get pending invitations for club (admin view)
     */
    listClubInvitations(clubId: string, options: ListInvitationsOptions): Promise<ClubInvitation[]>;
    /**
     * Expire old invitations
     */
    expireInvitations(beforeDate: Date): Promise<number>;
    /**
     * Get invitation statistics for club
     */
    getInvitationStats(clubId: string): Promise<{
        pending: number;
        accepted: number;
        declined: number;
        expired: number;
        cancelled: number;
    }>;
    /**
     * Convert DynamoDB canonical item to Invitation
     */
    private dynamoItemToInvitation;
    /**
     * Convert Invitation to DynamoDB canonical item
     */
    private invitationToCanonicalItem;
    /**
     * Convert Invitation to DynamoDB user index item (for in-app invitations)
     */
    private invitationToUserIndexItem;
}
