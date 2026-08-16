const { config } = require('dotenv');
const { resolve } = require('path');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const axios = require('axios');

// Load environment variables
config({ path: resolve(process.cwd(), 'apps/api/.env') });

const LINE_API_BASE = 'https://api.line.me/v2/bot';
const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({ projectId: 'real-bot-6a793' });
}
const db = getFirestore();

async function getGroupMemberCount(groupId) {
  try {
    const response = await axios.get(
      `${LINE_API_BASE}/group/${groupId}/members/count`,
      {
        headers: {
          Authorization: `Bearer ${channelAccessToken}`,
        },
      },
    );
    return response.data.count;
  } catch (error) {
    console.error(`Failed to fetch group member count for ${groupId}`, error.message);
    return null;
  }
}

async function run() {
  console.log('Fetching all groups from Firestore...');
  const snapshot = await db.collection('lineGroups').get();
  
  for (const doc of snapshot.docs) {
    const groupId = doc.id;
    console.log(`Processing group: ${groupId}`);
    const count = await getGroupMemberCount(groupId);
    
    if (count !== null) {
      console.log(`Setting memberCount = ${count} for group ${groupId}`);
      await doc.ref.update({
        memberCount: count,
        groupSummaryUpdatedAt: new Date(),
      });
    }
  }
  
  console.log('Done!');
  process.exit(0);
}

run().catch(console.error);
