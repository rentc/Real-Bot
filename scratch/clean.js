const admin = require('firebase-admin');

// Ensure we pick up the default credentials 
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function deleteCollection(collectionPath) {
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.get();
  
  const batchSize = snapshot.size;
  if (batchSize === 0) {
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}

async function cleanAndSeed() {
  console.log('Cleaning old products...');
  await deleteCollection('products');
  console.log('Cleaning old prices...');
  await deleteCollection('prices');
  console.log('Done!');
}

cleanAndSeed().catch(console.error);
