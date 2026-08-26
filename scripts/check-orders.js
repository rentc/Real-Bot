const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

async function checkOrders() {
  const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').limit(5).get();
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
}

checkOrders().catch(console.error);
