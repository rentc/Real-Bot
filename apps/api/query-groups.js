const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
admin.initializeApp({
  projectId: "real-bot-6a793"
});
const db = getFirestore();
db.collection('lineGroups').get().then(snapshot => {
  console.log("Found " + snapshot.size + " groups");
  snapshot.forEach(doc => {
    console.log(doc.id, doc.data());
  });
}).catch(e => console.error(e));
