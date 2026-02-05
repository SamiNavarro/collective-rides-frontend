#!/usr/bin/env node

/**
 * Make Alice Admin an owner of Attaquer.cc
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'sydney-cycles-main-development';
const ALICE_USER_ID = 'b12ba510-80b1-708f-ff85-d56755c2596f';
const CLUB_ID = 'attaquercc';

async function updateAliceRole() {
  console.log('\n👑 Making Alice owner of Attaquer.cc...\n');

  const now = new Date().toISOString();

  try {
    // Update Alice's membership to owner
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `CLUB#${CLUB_ID}`,
        SK: `MEMBER#${ALICE_USER_ID}`
      },
      UpdateExpression: 'SET #role = :role, updatedAt = :now',
      ExpressionAttributeNames: {
        '#role': 'role'
      },
      ExpressionAttributeValues: {
        ':role': 'owner',
        ':now': now
      }
    }));

    console.log('✅ Alice is now the owner of Attaquer.cc!\n');
    return true;
  } catch (error) {
    console.error('❌ Error updating role:', error.message);
    return false;
  }
}

async function verifyMembership() {
  console.log('🔍 Verifying membership...\n');

  try {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `CLUB#${CLUB_ID}`,
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
      return membership.role === 'owner';
    }

    console.log('❌ Membership not found\n');
    return false;
  } catch (error) {
    console.error('❌ Error verifying:', error.message);
    return false;
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║       Make Alice Owner of Attaquer.cc - Phase 3.4         ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Update Alice's role
    const updated = await updateAliceRole();

    if (!updated) {
      console.log('❌ Failed to update role\n');
      process.exit(1);
    }

    // Verify it worked
    const verified = await verifyMembership();

    if (verified) {
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║                      SUCCESS! 🎉                           ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');
      console.log('Alice Admin is now the owner of: Attaquer.cc');
      console.log('Club ID: attaquercc\n');
      console.log('Test by:');
      console.log('1. Refresh your browser');
      console.log('2. Navigate to My Clubs');
      console.log('3. Click on "Attaquer.cc"');
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
