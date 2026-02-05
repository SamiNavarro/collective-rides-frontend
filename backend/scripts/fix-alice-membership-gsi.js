#!/usr/bin/env node

/**
 * Fix Alice's membership GSI indexes
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'sydney-cycles-main-development';
const ALICE_USER_ID = 'b12ba510-80b1-708f-ff85-d56755c2596f';
const CLUB_ID = 'attaquercc';

async function fixMembership() {
  console.log('\n🔧 Fixing Alice\'s membership record...\n');

  try {
    // Get the current membership record
    const getResult = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `CLUB#${CLUB_ID}`,
        SK: `MEMBER#${ALICE_USER_ID}`
      }
    }));

    if (!getResult.Item) {
      console.log('❌ Membership record not found\n');
      return false;
    }

    console.log('Current record:', JSON.stringify(getResult.Item, null, 2));
    console.log('');

    // Update the record with proper GSI indexes
    const now = new Date().toISOString();
    const updatedItem = {
      ...getResult.Item,
      role: 'owner',
      updatedAt: now,
      // Ensure GSI1 indexes are set correctly
      GSI1PK: `USER#${ALICE_USER_ID}`,
      GSI1SK: `MEMBERSHIP#${CLUB_ID}`
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: updatedItem
    }));

    console.log('✅ Membership record updated with GSI indexes!\n');
    console.log('Updated record:', JSON.stringify(updatedItem, null, 2));
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║          Fix Alice Membership GSI - Phase 3.4             ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const fixed = await fixMembership();

  if (fixed) {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                      SUCCESS! 🎉                           ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('Alice\'s membership has been fixed with proper GSI indexes.');
    console.log('Wait 5-10 seconds for DynamoDB to propagate, then refresh your browser.\n');
  } else {
    console.log('❌ Failed to fix membership\n');
    process.exit(1);
  }
}

main();
