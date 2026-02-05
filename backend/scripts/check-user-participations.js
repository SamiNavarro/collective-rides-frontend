#!/usr/bin/env node

/**
 * Check User Participations
 * 
 * Shows all participations for a specific user
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'sydney-cycles-main-development';

// testuser2@test.com user ID (you'll need to find this)
const USER_EMAIL = process.argv[2] || 'testuser2@test.com';

async function findUserByEmail(email) {
  const params = {
    TableName: TABLE_NAME,
    FilterExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': email
    }
  };

  const result = await docClient.send(new ScanCommand(params));
  return result.Items && result.Items.length > 0 ? result.Items[0] : null;
}

async function getUserParticipations(userId) {
  const params = {
    TableName: TABLE_NAME,
    FilterExpression: 'userId = :userId AND entityType = :type',
    ExpressionAttributeValues: {
      ':userId': userId,
      ':type': 'RIDE_PARTICIPATION'
    }
  };

  const result = await docClient.send(new ScanCommand(params));
  return result.Items || [];
}

async function checkUserParticipations() {
  console.log('\n=== Checking User Participations ===\n');
  
  console.log(`Looking for user: ${USER_EMAIL}`);
  const user = await findUserByEmail(USER_EMAIL);
  
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  console.log(`✅ Found user: ${user.userId || user.PK}\n`);
  
  const userId = user.userId || user.PK?.replace('USER#', '');
  
  console.log('Fetching participations...');
  const participations = await getUserParticipations(userId);
  
  console.log(`Found ${participations.length} participations\n`);
  
  if (participations.length === 0) {
    console.log('No participations found for this user.');
    return;
  }
  
  participations.forEach((p, index) => {
    console.log(`\n${index + 1}. Participation:`);
    console.log(`   Ride ID: ${p.rideId}`);
    console.log(`   Status: ${p.status}`);
    console.log(`   Role: ${p.role}`);
    console.log(`   Joined: ${p.joinedAt}`);
    console.log(`   PK: ${p.PK}`);
    console.log(`   SK: ${p.SK}`);
  });
  
  console.log('\n========================================');
  console.log('Summary');
  console.log('========================================');
  
  const statusCounts = {};
  participations.forEach(p => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });
  
  console.log('Status breakdown:', statusCounts);
  console.log('');
}

checkUserParticipations().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error(error);
  process.exit(1);
});
