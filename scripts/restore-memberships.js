// Restore removed memberships to active status
// This fixes the issue where all clubs are marked as removed

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = 'sydney-cycles-main-development';
const AWS_REGION = 'us-east-2';
const USER_ID = '512be5a0-f031-701c-787e-15a05bbb0ad1';

const client = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

async function restoreMemberships() {
  console.log('🔧 Restoring removed memberships to active status');
  console.log('='.repeat(60));
  console.log(`User ID: ${USER_ID}\n`);
  
  try {
    // Query all removed memberships
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      FilterExpression: '#status = :removed',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':pk': `USER#${USER_ID}`,
        ':sk': 'MEMBERSHIP#CLUB#',
        ':removed': 'removed'
      }
    }));
    
    const removedMemberships = result.Items || [];
    
    if (removedMemberships.length === 0) {
      console.log('✅ No removed memberships found. Nothing to restore.');
      return;
    }
    
    console.log(`📋 Found ${removedMemberships.length} removed memberships:\n`);
    
    // Restore each membership
    for (const membership of removedMemberships) {
      console.log(`🔄 Restoring: ${membership.clubName || membership.clubId}`);
      
      try {
        // Update both the user's membership record
        await docClient.send(new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: membership.PK,
            SK: membership.SK
          },
          UpdateExpression: 'SET #status = :active, updatedAt = :now',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: {
            ':active': 'active',
            ':now': new Date().toISOString()
          }
        }));
        
        // Also update the club's member record (GSI1)
        if (membership.GSI1PK && membership.GSI1SK) {
          await docClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
              PK: membership.GSI1PK,
              SK: membership.GSI1SK
            },
            UpdateExpression: 'SET #status = :active, updatedAt = :now',
            ExpressionAttributeNames: {
              '#status': 'status'
            },
            ExpressionAttributeValues: {
              ':active': 'active',
              ':now': new Date().toISOString()
            }
          }));
        }
        
        console.log(`   ✅ Restored to active`);
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`\n✅ Restored ${removedMemberships.length} memberships to active status`);
    console.log('\n💡 Now refresh http://localhost:3000/my-clubs to see your clubs!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

restoreMemberships();
