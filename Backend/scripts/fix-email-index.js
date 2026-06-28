/**
 * One-time migration: drop the old non-sparse unique index on `email`
 * so Mongoose can recreate it as sparse (allowing multiple null values).
 * Run once: node Backend/scripts/fix-email-index.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function fixIndex() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  const db = mongoose.connection.db;
  const collection = db.collection('users');

  // List existing indexes
  const indexes = await collection.indexes();
  console.log('Current indexes:', indexes.map(i => ({ name: i.name, key: i.key, sparse: i.sparse })));

  // Drop the old email index if it exists and is NOT sparse
  const emailIndex = indexes.find(i => i.key && i.key.email === 1);
  if (emailIndex) {
    if (!emailIndex.sparse) {
      console.log(`Dropping non-sparse index: ${emailIndex.name}`);
      await collection.dropIndex(emailIndex.name);
      console.log('Dropped. Mongoose will recreate it as sparse on next startup.');
    } else {
      console.log('Email index is already sparse — no action needed.');
    }
  } else {
    console.log('No email index found — no action needed.');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

fixIndex().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
