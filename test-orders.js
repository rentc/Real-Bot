const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // wait, let's just use curl against the API to get orders or quotations. No, wait, I can use node with firebase-admin locally? Actually I don't have the serviceAccountKey.json locally.
