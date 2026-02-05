#!/usr/bin/env node

/**
 * Make Alice Admin an owner of a club directly via DynamoDB
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'sydney-cycles-main-development';
const ALICE_USER_ID = 'b12ba510-80b1-708f-ff85-d56755c2596f';

async function findOrCreateClub() {
  console.log('🔍 Looking for existing clubs...\n');
  
  // Scan for clubs
  const scanResult = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: 'begins_with(PK, :pk) AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': 'CLUB#',
      ':sk': 'METADATA#'
    },
    Limit: 10
  }));

  if (scanResult.Items && scanResult.Items.length > 0) {
    const club = scanResult.Items[0];
    const clubId = club.PK.replace('CLUB#', '');
    console.log(`✅ Found existing club: ${club.name} (${clubId})\n`);
    return { clubId, name: club.name };
  }

  // Create a new club
  console.log('📝 No clubs found, creating test club...\n');
  
  const clubId = `club_${Date.now()}`;
  const now = new Date().toISOString();

  const clubItem = {
    PK: `CLUB#${clubId}`,
    SK: 'METADATA#',
    id: clubId,
    name: 'Alice Test Club',
    description: 'Test club for Phase 3.4 - Club Administration',
    city: 'Sydney',
    membershipApprovalType: 'request_to_join',
    createdAt: now,
    updatedAt: now,
    createdBy: ALICE_USER_ID,
    GSI1PK: 'CLUB',
    GSI1SK: `CLUB#${clubId}`
  };

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: clubItem
  }));

  console.log(`✅ Created club: ${clubItem.name} (${clubId})\n`);
  return { clubId, name: clubItem.name };
}

async function makeAliceOwner(clubId, clubName) {
  console.log(`👑 Making Alice owner of ${clubName}...\n`);

  const now = new Date().toISOString();

  // Create membership record
  const membershipItem = {
    PK: `CLUB#${clubId}`,
    SK: `MEMBER#${ALICE_USER_ID}`,
    userId: ALICE_USER_ID,
    clubId: clubId,
    role: 'owner',
    status: 'active',
    joinedAt: now,
    updatedAt: now,
    GSI1PK: `USER#${ALICE_USER_ID}`,
    GSI1SK: `MEMBERSHIP#${clubId}`
  };

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: membershipItem
  }));

  console.log('✅ Alice is now the owner!\n');
}

async function verifyMembership(clubId) {
  console.log('🔍 Verifying membership...\n');

  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND SK = :sk',
    ExpressionAttributeValues: {
      ':pk': `CLUB#${clubId}`,
      ':sk': `MEMBER#${ALICE_USER_ID}`
    }
  }));

  if (result.Items && result.Items.length > 0) {
    const membership = result.Items[0];
    console.log('✅ Membership verified:');
    console.log(`   User: ${membership.userId}`);
    console.log(`   Club: ${membership.clubId}`);
    console.log(`   Role: ${membership.role}`);
    console.log(`   Status: ${membership.status}`);
    console.log('');
    return true;
  }

  console.log('❌ Membership not found\n');
  return false;
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║       Make Alice Admin Club Owner - Phase 3.4             ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Find or create a club
    const { clubId, name } = await findOrCreateClub();

    // Make Alice the owner
    await makeAliceOwner(clubId, name);

    // Verify it worked
    const verified = await verifyMembership(clubId);

    if (verified) {
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║                      SUCCESS! 🎉                           ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');
      console.log(`Alice Admin is now the owner of: ${name}`);
      console.log(`Club ID: ${clubId}\n`);
      console.log('Test by:');
      console.log('1. Log in as alice.admin@example.com');
      console.log('2. Navigate to My Clubs');
      console.log('3. Click on the club');
      console.log('4. You should see "Settings" and "Manage Club" buttons\n');
    } else {
      console.log('❌ Verification failed\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
