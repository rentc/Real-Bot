const axios = require('axios');
const { config } = require('dotenv');
const { resolve } = require('path');

config({ path: resolve(process.cwd(), 'apps/api/.env') });

async function testLineApi() {
  const groupId = 'C075308ce7e1f409bd1bb624fbdaffbd9'; // Example group ID, but I can just test with an invalid one to see if it's 403 or 400
  // Actually, I can just fetch groups from DB
  const admin = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  
  if (admin.getApps().length === 0) {
    admin.initializeApp({ projectId: 'real-bot-6a793' });
  }
  const db = getFirestore();
  
  const snap = await db.collection('lineGroups').limit(1).get();
  if (snap.empty) {
    console.log('No groups');
    return;
  }
  const realGroupId = snap.docs[0].id;
  console.log(`Testing with group ${realGroupId}`);
  
  try {
    const res = await axios.get(`https://api.line.me/v2/bot/group/${realGroupId}/members/ids`, {
      headers: { Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}` }
    });
    console.log('Success!', res.data);
  } catch (err) {
    console.error('Error fetching member IDs:', err.response?.status, err.response?.data);
  }
}
testLineApi();
