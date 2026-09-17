/**
 * seed-admin.js — CarePath AI
 *
 * Creates the initial ADMIN user.
 * Run once: node seed/seed-admin.js
 *
 * Usage:
 *   ADMIN_EMAIL=admin@hospital.ai ADMIN_PASSWORD=Admin@1234 node seed/seed-admin.js
 *
 * If env vars are not set, falls back to defaults below.
 */

'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('[seed-admin] MONGODB_URI is not set. Add it to your .env file.');
  process.exit(1);
}

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'bathalabalji50@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'IBM01Balaji';
const ADMIN_NAME     = process.env.ADMIN_NAME     || 'Balaji (Founder)';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('[seed-admin] Connected to MongoDB');

  // Require models after connection
  require('../models');
  const User = mongoose.model('User');

  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    if (existing.role === 'ADMIN') {
      console.log(`[seed-admin] Admin already exists: ${ADMIN_EMAIL}`);
    } else {
      console.log(`[seed-admin] A non-admin user with this email exists: ${existing.role}`);
    }
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const admin = await User.create({
    name:       ADMIN_NAME,
    email:      ADMIN_EMAIL.toLowerCase(),
    password:   passwordHash,
    role:       'ADMIN',
    isVerified: true,
    isActive:   true,
  });

  console.log('[seed-admin] ✓ Admin created successfully');
  console.log(`  Email:    ${admin.email}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  Role:     ${admin.role}`);
  console.log('');
  console.log('  Login at /login with these credentials to access the Admin Dashboard.');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seed-admin] Error:', err.message);
  process.exit(1);
});
