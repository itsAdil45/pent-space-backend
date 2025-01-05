var admin = require("firebase-admin");

var serviceAccount = require("./pentspace-9061d-firebase-adminsdk-17fxo-6dca2c5eec.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
