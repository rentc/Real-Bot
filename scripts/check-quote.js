const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
initializeApp();
const db = getFirestore();

async function checkQuote() {
  const doc = await db.collection('quotations').doc('QT-2026082603').get();
  if (!doc.exists) {
    console.log('Quote not found!');
  } else {
    console.log('Status:', doc.data().status);
  }
}
checkQuote().catch(console.error);
