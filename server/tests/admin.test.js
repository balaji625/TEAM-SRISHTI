/**
 * admin.test.js — CarePath AI
 *
 * Stage 10 tests for Admin API endpoints.
 * Covers: overview, users listing, pending queues, verify actions.
 */

'use strict';

const request   = require('supertest');
const mongoose  = require('mongoose');
const jwt       = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET     = 'test-secret-carepath-ai-stage10';
process.env.JWT_EXPIRES_IN = '1h';
process.env.NODE_ENV       = 'test';
process.env.CLIENT_URL     = 'http://localhost:5173';

jest.setTimeout(30000);

const app = require('../server');
const { User, Hospital, Professional, Expert } = require('../models');

let mongod;

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Hospital.deleteMany({}),
    Professional.deleteMany({}),
    Expert.deleteMany({}),
  ]);
});

// ── Helpers ───────────────────────────────────────────────────────────────────
// ADMIN can only be created directly — public registration is blocked (403)
const createAdminToken = () =>
  jwt.sign({ sub: new mongoose.Types.ObjectId().toString(), role: 'ADMIN' },
    process.env.JWT_SECRET, { expiresIn: '1h', issuer: 'carepath-ai' });

const reg = (role, email) =>
  request(app).post('/api/auth/register')
    .send({ name: 'Test', email: email || `${role.toLowerCase()}@test.com`, password: 'Password1', role })
    .then((r) => r.body.data.token);

// ── GET /api/admin/overview ───────────────────────────────────────────────────
describe('GET /api/admin/overview', () => {
  test('Returns platform stats for ADMIN', async () => {
    const token = createAdminToken();
    // Seed a couple of users
    await reg('USER', 'u1@test.com');
    await reg('HOSPITAL', 'h1@test.com');
    const res = await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.overview.users.total).toBeGreaterThanOrEqual(2);
    expect(res.body.data.overview).toHaveProperty('totalPending');
  });

  test('Returns 401 without token', async () => {
    expect((await request(app).get('/api/admin/overview')).status).toBe(401);
  });

  test('Returns 403 for non-ADMIN (USER)', async () => {
    const token = await reg('USER', 'user2@test.com');
    expect((await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${token}`)).status).toBe(403);
  });
});

// ── GET /api/admin/users ──────────────────────────────────────────────────────
describe('GET /api/admin/users', () => {
  test('Lists users for ADMIN', async () => {
    const token = createAdminToken();
    await reg('USER', 'u3@test.com');
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.users)).toBe(true);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
  });

  test('Filters by role', async () => {
    const token = createAdminToken();
    await reg('USER', 'u4@test.com');
    await reg('HOSPITAL', 'h2@test.com');
    const res = await request(app).get('/api/admin/users?role=HOSPITAL').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.users.every((u) => u.role === 'HOSPITAL')).toBe(true);
  });

  test('Response never includes password', async () => {
    const token = createAdminToken();
    await reg('USER', 'u5@test.com');
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`);
    expect(JSON.stringify(res.body)).not.toContain('$2b$');
    res.body.data.users.forEach((u) => expect(u.password).toBeUndefined());
  });
});

// ── GET /api/admin/hospitals/pending ─────────────────────────────────────────
describe('GET /api/admin/hospitals/pending', () => {
  test('Returns pending hospitals', async () => {
    const token = createAdminToken();
    const hospToken = await reg('HOSPITAL', 'h3@test.com');
    // Create a hospital profile (status defaults to PENDING)
    await request(app).put('/api/hospital/profile').set('Authorization', `Bearer ${hospToken}`)
      .send({ name: 'Test Hospital', email: 'info@testhospital.com' });
    const res = await request(app).get('/api/admin/hospitals/pending').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.hospitals.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.hospitals[0].verificationStatus).toBe('PENDING');
  });
});

// ── PUT /api/admin/hospitals/:id/verify ───────────────────────────────────────
describe('PUT /api/admin/hospitals/:id/verify', () => {
  test('Admin can approve a hospital', async () => {
    const adminToken = createAdminToken();
    const hospToken  = await reg('HOSPITAL', 'h4@test.com');
    await request(app).put('/api/hospital/profile').set('Authorization', `Bearer ${hospToken}`)
      .send({ name: 'Approve Me Hospital', email: 'approveme@hosp.com' });
    // Get the hospital id
    const pending = await request(app).get('/api/admin/hospitals/pending').set('Authorization', `Bearer ${adminToken}`);
    const hospId = pending.body.data.hospitals[0]._id;
    const res = await request(app)
      .put(`/api/admin/hospitals/${hospId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve' });
    expect(res.status).toBe(200);
    expect(res.body.data.hospital.verificationStatus).toBe('VERIFIED');
  });

  test('Admin can reject a hospital with reason', async () => {
    const adminToken = createAdminToken();
    const hospToken  = await reg('HOSPITAL', 'h5@test.com');
    await request(app).put('/api/hospital/profile').set('Authorization', `Bearer ${hospToken}`)
      .send({ name: 'Reject Me', email: 'rejectme@hosp.com' });
    const pending = await request(app).get('/api/admin/hospitals/pending').set('Authorization', `Bearer ${adminToken}`);
    const hospId  = pending.body.data.hospitals[0]._id;
    const res = await request(app)
      .put(`/api/admin/hospitals/${hospId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'reject', reason: 'Incomplete documentation' });
    expect(res.status).toBe(200);
    expect(res.body.data.hospital.verificationStatus).toBe('REJECTED');
  });

  test('Returns 400 for invalid action', async () => {
    const adminToken = createAdminToken();
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/api/admin/hospitals/${fakeId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'hack' });
    expect(res.status).toBe(400);
  });

  test('Returns 403 for non-ADMIN', async () => {
    const userToken = await reg('USER', 'u6@test.com');
    const fakeId    = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/api/admin/hospitals/${fakeId}/verify`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ action: 'approve' });
    expect(res.status).toBe(403);
  });
});
