const admin = require('firebase-admin');

admin.initializeApp();

const { publicCatalog } = require('./src/public/catalog');

exports.publicCatalog = publicCatalog;
