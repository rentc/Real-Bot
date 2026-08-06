const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

async function run() {
  const products = await db.collection('products').get();
  console.log("Products count:", products.size);
}

run().catch(console.error);
