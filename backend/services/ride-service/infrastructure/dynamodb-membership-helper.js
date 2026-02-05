"use strict";
/**
 * Membership Helper for Ride Service
 *
 * Provides utilities to fetch club memberships for authorization checks.
 * This is a lightweight helper to avoid circular dependencies with club-service.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipHelper = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
class MembershipHelper {
    constructor(dynamoClient, tableName) {
        this.docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
        this.tableName = tableName;
    }
    /**
     * Get user's club memberships for authorization
     *
     * @param userId - User ID
     * @returns Array of club memberships
     */
    async getUserMemberships(userId) {
        const result = await this.docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: this.tableName,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
                ':sk': 'MEMBERSHIP#',
            },
        }));
        if (!result.Items || result.Items.length === 0) {
            return [];
        }
        return result.Items.map((item) => ({
            membershipId: item.membershipId,
            clubId: item.clubId,
            role: item.role,
            status: item.status,
            joinedAt: item.joinedAt,
        }));
    }
    /**
     * Get user's membership for a specific club
     *
     * @param userId - User ID
     * @param clubId - Club ID
     * @returns Club membership or null
     */
    async getUserMembershipForClub(userId, clubId) {
        const result = await this.docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: this.tableName,
            KeyConditionExpression: 'PK = :pk AND SK = :sk',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
                ':sk': `MEMBERSHIP#${clubId}`,
            },
        }));
        if (!result.Items || result.Items.length === 0) {
            return null;
        }
        const item = result.Items[0];
        return {
            membershipId: item.membershipId,
            clubId: item.clubId,
            role: item.role,
            status: item.status,
            joinedAt: item.joinedAt,
        };
    }
}
exports.MembershipHelper = MembershipHelper;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHluYW1vZGItbWVtYmVyc2hpcC1oZWxwZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkeW5hbW9kYi1tZW1iZXJzaGlwLWhlbHBlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7O0dBS0c7OztBQUdILHdEQUE2RTtBQVU3RSxNQUFhLGdCQUFnQjtJQUkzQixZQUFZLFlBQTRCLEVBQUUsU0FBaUI7UUFDekQsSUFBSSxDQUFDLFNBQVMsR0FBRyxxQ0FBc0IsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDM0QsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7SUFDN0IsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLGtCQUFrQixDQUFDLE1BQWM7UUFDckMsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FDdEMsSUFBSSwyQkFBWSxDQUFDO1lBQ2YsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO1lBQ3pCLHNCQUFzQixFQUFFLG1DQUFtQztZQUMzRCx5QkFBeUIsRUFBRTtnQkFDekIsS0FBSyxFQUFFLFFBQVEsTUFBTSxFQUFFO2dCQUN2QixLQUFLLEVBQUUsYUFBYTthQUNyQjtTQUNGLENBQUMsQ0FDSCxDQUFDO1FBRUYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQzlDLE9BQU8sRUFBRSxDQUFDO1NBQ1g7UUFFRCxPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2pDLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWTtZQUMvQixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07WUFDbkIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO1lBQ25CLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtTQUN4QixDQUFDLENBQUMsQ0FBQztJQUNOLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsd0JBQXdCLENBQzVCLE1BQWMsRUFDZCxNQUFjO1FBRWQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FDdEMsSUFBSSwyQkFBWSxDQUFDO1lBQ2YsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO1lBQ3pCLHNCQUFzQixFQUFFLHVCQUF1QjtZQUMvQyx5QkFBeUIsRUFBRTtnQkFDekIsS0FBSyxFQUFFLFFBQVEsTUFBTSxFQUFFO2dCQUN2QixLQUFLLEVBQUUsY0FBYyxNQUFNLEVBQUU7YUFDOUI7U0FDRixDQUFDLENBQ0gsQ0FBQztRQUVGLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUM5QyxPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3QixPQUFPO1lBQ0wsWUFBWSxFQUFFLElBQUksQ0FBQyxZQUFZO1lBQy9CLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtZQUNuQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDZixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07WUFDbkIsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1NBQ3hCLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUEzRUQsNENBMkVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBNZW1iZXJzaGlwIEhlbHBlciBmb3IgUmlkZSBTZXJ2aWNlXG4gKiBcbiAqIFByb3ZpZGVzIHV0aWxpdGllcyB0byBmZXRjaCBjbHViIG1lbWJlcnNoaXBzIGZvciBhdXRob3JpemF0aW9uIGNoZWNrcy5cbiAqIFRoaXMgaXMgYSBsaWdodHdlaWdodCBoZWxwZXIgdG8gYXZvaWQgY2lyY3VsYXIgZGVwZW5kZW5jaWVzIHdpdGggY2x1Yi1zZXJ2aWNlLlxuICovXG5cbmltcG9ydCB7IER5bmFtb0RCQ2xpZW50IH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiJztcbmltcG9ydCB7IER5bmFtb0RCRG9jdW1lbnRDbGllbnQsIFF1ZXJ5Q29tbWFuZCB9IGZyb20gJ0Bhd3Mtc2RrL2xpYi1keW5hbW9kYic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2x1Yk1lbWJlcnNoaXAge1xuICBtZW1iZXJzaGlwSWQ6IHN0cmluZztcbiAgY2x1YklkOiBzdHJpbmc7XG4gIHJvbGU6IHN0cmluZztcbiAgc3RhdHVzOiBzdHJpbmc7XG4gIGpvaW5lZEF0OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBNZW1iZXJzaGlwSGVscGVyIHtcbiAgcHJpdmF0ZSBkb2NDbGllbnQ6IER5bmFtb0RCRG9jdW1lbnRDbGllbnQ7XG4gIHByaXZhdGUgdGFibGVOYW1lOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoZHluYW1vQ2xpZW50OiBEeW5hbW9EQkNsaWVudCwgdGFibGVOYW1lOiBzdHJpbmcpIHtcbiAgICB0aGlzLmRvY0NsaWVudCA9IER5bmFtb0RCRG9jdW1lbnRDbGllbnQuZnJvbShkeW5hbW9DbGllbnQpO1xuICAgIHRoaXMudGFibGVOYW1lID0gdGFibGVOYW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB1c2VyJ3MgY2x1YiBtZW1iZXJzaGlwcyBmb3IgYXV0aG9yaXphdGlvblxuICAgKiBcbiAgICogQHBhcmFtIHVzZXJJZCAtIFVzZXIgSURcbiAgICogQHJldHVybnMgQXJyYXkgb2YgY2x1YiBtZW1iZXJzaGlwc1xuICAgKi9cbiAgYXN5bmMgZ2V0VXNlck1lbWJlcnNoaXBzKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxDbHViTWVtYmVyc2hpcFtdPiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5kb2NDbGllbnQuc2VuZChcbiAgICAgIG5ldyBRdWVyeUNvbW1hbmQoe1xuICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uOiAnUEsgPSA6cGsgQU5EIGJlZ2luc193aXRoKFNLLCA6c2spJyxcbiAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xuICAgICAgICAgICc6cGsnOiBgVVNFUiMke3VzZXJJZH1gLFxuICAgICAgICAgICc6c2snOiAnTUVNQkVSU0hJUCMnLFxuICAgICAgICB9LFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgaWYgKCFyZXN1bHQuSXRlbXMgfHwgcmVzdWx0Lkl0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQuSXRlbXMubWFwKChpdGVtKSA9PiAoe1xuICAgICAgbWVtYmVyc2hpcElkOiBpdGVtLm1lbWJlcnNoaXBJZCxcbiAgICAgIGNsdWJJZDogaXRlbS5jbHViSWQsXG4gICAgICByb2xlOiBpdGVtLnJvbGUsXG4gICAgICBzdGF0dXM6IGl0ZW0uc3RhdHVzLFxuICAgICAgam9pbmVkQXQ6IGl0ZW0uam9pbmVkQXQsXG4gICAgfSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB1c2VyJ3MgbWVtYmVyc2hpcCBmb3IgYSBzcGVjaWZpYyBjbHViXG4gICAqIFxuICAgKiBAcGFyYW0gdXNlcklkIC0gVXNlciBJRFxuICAgKiBAcGFyYW0gY2x1YklkIC0gQ2x1YiBJRFxuICAgKiBAcmV0dXJucyBDbHViIG1lbWJlcnNoaXAgb3IgbnVsbFxuICAgKi9cbiAgYXN5bmMgZ2V0VXNlck1lbWJlcnNoaXBGb3JDbHViKFxuICAgIHVzZXJJZDogc3RyaW5nLFxuICAgIGNsdWJJZDogc3RyaW5nXG4gICk6IFByb21pc2U8Q2x1Yk1lbWJlcnNoaXAgfCBudWxsPiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5kb2NDbGllbnQuc2VuZChcbiAgICAgIG5ldyBRdWVyeUNvbW1hbmQoe1xuICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uOiAnUEsgPSA6cGsgQU5EIFNLID0gOnNrJyxcbiAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xuICAgICAgICAgICc6cGsnOiBgVVNFUiMke3VzZXJJZH1gLFxuICAgICAgICAgICc6c2snOiBgTUVNQkVSU0hJUCMke2NsdWJJZH1gLFxuICAgICAgICB9LFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgaWYgKCFyZXN1bHQuSXRlbXMgfHwgcmVzdWx0Lkl0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgaXRlbSA9IHJlc3VsdC5JdGVtc1swXTtcbiAgICByZXR1cm4ge1xuICAgICAgbWVtYmVyc2hpcElkOiBpdGVtLm1lbWJlcnNoaXBJZCxcbiAgICAgIGNsdWJJZDogaXRlbS5jbHViSWQsXG4gICAgICByb2xlOiBpdGVtLnJvbGUsXG4gICAgICBzdGF0dXM6IGl0ZW0uc3RhdHVzLFxuICAgICAgam9pbmVkQXQ6IGl0ZW0uam9pbmVkQXQsXG4gICAgfTtcbiAgfVxufVxuIl19