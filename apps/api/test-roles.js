const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
initializeApp({ projectId: "real-bot-6a793" });
const db = getFirestore();

async function run() {
  for (const roleId of ['CUSTOMER', 'ADMIN', 'STAFF']) {
    const doc = await db.collection('roles').doc(roleId).get();
    if (!doc.exists) {
      console.log('Creating role', roleId);
      await db.collection('roles').doc(roleId).set({ name: roleId });
    } else {
      console.log('Role exists', roleId);
    }
  }
}
run().catch(console.error);
