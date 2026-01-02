/**
 * DynamoDB User Repository - Phase 1.2
 * 
 * DynamoDB implementation of the user repository interface using the
 * existing single table from Phase 1.1.
 * 
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 * - AWS Architecture: .kiro/specs/architecture.aws.v1.md
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { User, CreateUserInput, UpdateUserInput, SystemRole } from '../../../shared/types/user';
import { InternalError, NotFoundError } from '../../../shared/utils/errors';
import { IUserRepository } from '../domain/user-repository';

/**
 * DynamoDB implementation of user repository
 */
export class DynamoDBUserRepository implements IUserRepository {
  private readonly docClient: DynamoDBDocumentClient;
  
  constructor(
    private readonly tableName: string,
    dynamoClient?: DynamoDBClient
  ) {
    const client = dynamoClient || new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(client);
  }
  
  /**
   * Get user by ID
   * 
   * @param userId - User ID
   * @returns User data or null if not found
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
        ConsistentRead: true, // Strong consistency as per spec
      });
      
      const result = await this.docClient.send(command);
      
      if (!result.Item) {
        return null;
      }
      
      return this.mapDynamoItemToUser(result.Item);
    } catch (error) {
      console.error('Error getting user by ID:', error, { userId });
      throw new InternalError('Failed to retrieve user');
    }
  }
  
  /**
   * Create a new user
   * 
   * @param input - User creation input
   * @returns Created user data
   */
  async createUser(input: CreateUserInput): Promise<User> {
    const now = new Date().toISOString();
    
    const user: User = {
      id: input.id,
      email: input.email,
      displayName: input.displayName || this.extractDisplayNameFromEmail(input.email),
      avatarUrl: input.avatarUrl,
      systemRole: SystemRole.USER, // Default to User as per domain rules
      createdAt: now,
      updatedAt: now,
    };
    
    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `USER#${user.id}`,
          SK: 'PROFILE',
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          systemRole: user.systemRole,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          // GSI attributes for future queries
          GSI1PK: `USER#${user.id}`,
          GSI1SK: 'PROFILE',
        },
        ConditionExpression: 'attribute_not_exists(PK)', // Prevent overwriting existing user
      });
      
      await this.docClient.send(command);
      
      return user;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        // User already exists, get and return existing user
        const existingUser = await this.getUserById(input.id);
        if (existingUser) {
          return existingUser;
        }
      }
      
      console.error('Error creating user:', error, { input });
      throw new InternalError('Failed to create user');
    }
  }
  
  /**
   * Update an existing user
   * 
   * @param userId - User ID
   * @param input - Update input
   * @returns Updated user data
   */
  async updateUser(userId: string, input: UpdateUserInput): Promise<User> {
    try {
      // Build update expression dynamically
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};
      
      if (input.displayName !== undefined) {
        updateExpressions.push('#displayName = :displayName');
        expressionAttributeNames['#displayName'] = 'displayName';
        expressionAttributeValues[':displayName'] = input.displayName;
      }
      
      if (input.avatarUrl !== undefined) {
        updateExpressions.push('#avatarUrl = :avatarUrl');
        expressionAttributeNames['#avatarUrl'] = 'avatarUrl';
        expressionAttributeValues[':avatarUrl'] = input.avatarUrl;
      }
      
      if (input.systemRole !== undefined) {
        updateExpressions.push('#systemRole = :systemRole');
        expressionAttributeNames['#systemRole'] = 'systemRole';
        expressionAttributeValues[':systemRole'] = input.systemRole;
      }
      
      // Always update the updatedAt timestamp
      updateExpressions.push('#updatedAt = :updatedAt');
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();
      
      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: 'attribute_exists(PK)', // Ensure user exists
        ReturnValues: 'ALL_NEW',
      });
      
      const result = await this.docClient.send(command);
      
      if (!result.Attributes) {
        throw new InternalError('Update operation did not return updated item');
      }
      
      return this.mapDynamoItemToUser(result.Attributes);
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new NotFoundError('User not found');
      }
      
      console.error('Error updating user:', error, { userId, input });
      throw new InternalError('Failed to update user');
    }
  }
  
  /**
   * Check if user exists
   * 
   * @param userId - User ID
   * @returns True if user exists
   */
  async userExists(userId: string): Promise<boolean> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
        ProjectionExpression: 'PK', // Only fetch the key to minimize data transfer
      });
      
      const result = await this.docClient.send(command);
      
      return !!result.Item;
    } catch (error) {
      console.error('Error checking user existence:', error, { userId });
      return false; // Assume user doesn't exist on error
    }
  }
  
  /**
   * Map DynamoDB item to User object
   * 
   * @param item - DynamoDB item
   * @returns User object
   */
  private mapDynamoItemToUser(item: Record<string, any>): User {
    return {
      id: item.PK.replace('USER#', ''),
      email: item.email,
      displayName: item.displayName,
      avatarUrl: item.avatarUrl,
      systemRole: item.systemRole as SystemRole,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
  
  /**
   * Extract display name from email address
   * 
   * @param email - Email address
   * @returns Display name
   */
  private extractDisplayNameFromEmail(email: string): string {
    const localPart = email.split('@')[0];
    
    // Convert to title case and replace common separators
    return localPart
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}