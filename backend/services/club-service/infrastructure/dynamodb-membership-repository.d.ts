/**
 * DynamoDB Membership Repository - Phase 2.2
 *
 * DynamoDB implementation of the membership repository interface.
 * Uses single-table design with multiple index items for efficient queries.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ClubMembership, ClubRole, MembershipStatus, JoinClubInput, UpdateMemberInput, ListMembersOptions, ListMembersResult, UserMembershipSummary } from '../../../shared/types/membership';
import { IMembershipRepository } from '../domain/membership/membership-repository';
import { IUserRepository } from '../../user-profile/domain/user-repository';
/**
 * DynamoDB membership repository implementation
 */
export declare class DynamoDBMembershipRepository implements IMembershipRepository {
    private userRepository?;
    private dynamoClient;
    private tableName;
    constructor(tableName?: string, userRepository?: IUserRepository | undefined, dynamoClient?: DynamoDBClient);
    /**
     * Get membership by club and user
     */
    getMembershipByClubAndUser(clubId: string, userId: string): Promise<ClubMembership | null>;
    /**
     * Get membership by ID
     */
    getMembershipById(membershipId: string): Promise<ClubMembership | null>;
    /**
     * List club members with pagination and filtering
     */
    listClubMembers(clubId: string, options: ListMembersOptions): Promise<ListMembersResult>;
    /**
     * List user's club memberships
     */
    listUserMemberships(userId: string, status?: MembershipStatus): Promise<UserMembershipSummary[]>;
    /**
     * Create a new membership
     */
    createMembership(clubId: string, userId: string, input: JoinClubInput, role?: ClubRole, status?: MembershipStatus): Promise<ClubMembership>;
    /**
     * Update membership role
     */
    updateMembershipRole(membershipId: string, input: UpdateMemberInput, updatedBy: string): Promise<ClubMembership>;
    /**
     * Update membership status
     */
    updateMembershipStatus(membershipId: string, status: MembershipStatus, processedBy?: string, reason?: string): Promise<ClubMembership>;
    /**
     * Update membership status by club and user (more efficient)
     */
    updateMembershipStatusByClubAndUser(clubId: string, userId: string, status: MembershipStatus, processedBy?: string, reason?: string): Promise<ClubMembership>;
    /**
     * Remove membership
     */
    removeMembership(membershipId: string, removedBy: string, reason?: string): Promise<ClubMembership>;
    /**
     * Remove membership by club and user (more efficient)
     */
    removeMembershipByClubAndUser(clubId: string, userId: string, removedBy: string, reason?: string): Promise<ClubMembership>;
    /**
     * Check if user is a member of club
     */
    isUserMember(clubId: string, userId: string): Promise<boolean>;
    /**
     * Get user's role in club
     */
    getUserRoleInClub(clubId: string, userId: string): Promise<ClubRole | null>;
    /**
     * Count club members by status
     */
    countClubMembers(clubId: string, status?: MembershipStatus): Promise<number>;
    /**
     * Get club owner
     */
    getClubOwner(clubId: string): Promise<ClubMembership | null>;
    /**
     * Get club admins (including owner)
     */
    getClubAdmins(clubId: string): Promise<ClubMembership[]>;
    /**
     * Check if user has pending membership request
     */
    hasPendingMembershipRequest(clubId: string, userId: string): Promise<boolean>;
    /**
     * Get club member count (active members only)
     */
    getClubMemberCount(clubId: string): Promise<number>;
    /**
     * Convert DynamoDB canonical item to Membership
     */
    private dynamoItemToMembership;
    /**
     * Convert ClubMemberInfo to ClubMembership
     */
    private memberInfoToMembership;
    /**
     * Convert Membership to DynamoDB canonical item
     */
    private membershipToCanonicalItem;
    /**
     * Convert Membership to DynamoDB user index item
     */
    private membershipToUserIndexItem;
    /**
     * Convert Membership to DynamoDB club member index item
     */
    private membershipToClubMemberIndexItem;
}
