// Check membership status in database
// Shows which clubs user is a member of and their status

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = 'sydney-cycles-main-development';
const AWS_REGION = 'us-east-2';
const USER_ID = '512be5a0-f031-701c-787e-15a05bbb0ad1';

const client = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

async function checkMemberships() {
  console.log('🔍 Checking membership status for user:', USER_ID);
  console.log('='.repeat(60));
  
  try {
    // Query all memberships for this user
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${USER_ID}`,
        ':sk': 'MEMBERSHIP#CLUB#'
      }
    }));
    
    console.log(`\n📊 Found ${result.Items?.length || 0} memberships:\n`);
    
    if (!result.Items || result.Items.length === 0) {
      console.log('❌ No memberships found!');
      console.log('\n💡 User needs to join clubs first.');
      console.log('   Go to http://localhost:3000/clubs/directory and join some clubs.');
      return;
    }
    
    // Group by status
    const byStatus = {
      active: [],
      pending: [],
      suspended: [],
      removed: []
    };
    
    result.Items.forEach(item => {
      const status = item.status || 'unknown';
      if (byStatus[status]) {
        byStatus[status].push(item);
      }
      
      console.log(`${getStatusIcon(status)} ${item.clubName || item.clubId}`);
      console.log(`   Club ID: ${item.clubId}`);
      console.log(`   Status: ${status}`);
      console.log(`   Role: ${item.role}`);
      console.log(`   Joined: ${item.joinedAt}`);
      console.log('');
    });
    
    console.log('='.repeat(60));
    console.log('\n📈 Summary:');
    console.log(`   ✅ Active: ${byStatus.active.length}`);
    console.log(`   ⏳ Pending: ${byStatus.pending.length}`);
    console.log(`   ⏸️  Suspended: ${byStatus.suspended.length}`);
    console.log(`   🚫 Removed: ${byStatus.removed.length}`);
    
    if (byStatus.removed.length > 0 && byStatus.active.length === 0) {
      console.log('\n⚠️  ALL clubs are marked as removed!');
      console.log('   This is why My Clubs page is empty.');
      console.log('\n💡 Options:');
      console.log('   1. Run: node scripts/restore-memberships.js');
      console.log('   2. Or join new clubs from the directory');
    }
    
    if (byStatus.active.length > 0) {
      console.log('\n✅ Active memberships found!');
      console.log('   These should show on My Clubs page.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'active': return '✅';
    case 'pending': return '⏳';
    case 'suspended': return '⏸️';
    case 'removed': return '🚫';
    default: return '❓';
  }
}

checkMemberships();
