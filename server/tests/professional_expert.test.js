/**
 * professional.test.js + expert.test.js — CarePath AI
 *
 * Stage 8/9 tests for Professional and Expert profile API endpoints.
 */

'use strict';

const request  = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET     = 'test-secret-carepath-ai-stage89';
process.env.JWT_EXPIRES_IN = '1h';
process.env.NODE_ENV       = 'test';
process.env.CLIENT_URL     = 'http://localhost:5173';

jest.setTimeout(30000);

const app = require('../server');
const { User, Professional, Expert } = require('../models');

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
  await User.deleteMany({});
  await Professional.deleteMany({});
  await Expert.deleteMany({});
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const reg = (role, email) =>
  request(app).post('/api/auth/register')
    .send({ name: 'Test Person', email: email || `${role.toLowerCase()}@example.com`, password: 'Password1', role })
    .then((r) => r.body.data.token);

// ══════════════════════════════════════════════════════════════════════════════
// PROFESSIONAL TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe('GET /api/professional/profile', () => {
  test('Returns null when no profile exists', async () => {
    const token = await reg('PROFESSIONAL');
    const res = await request(app).get('/api/professional/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.profile).toBeNull();
  });

  test('Returns 401 without token', async () => {
    expect((await request(app).get('/api/professional/profile')).status).toBe(401);
  });

  test('Returns 403 for USER role', async () => {
    const token = await reg('USER', 'user2@example.com');
    expect((await request(app).get('/api/professional/profile').set('Authorization', `Bearer ${token}`)).status).toBe(403);
  });
});

describe('PUT /api/professional/profile', () => {
  test('Creates professional profile on first call', async () => {
    const token = await reg('PROFESSIONAL');
    const res = await request(app)
      .put('/api/professional/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dr. Alice', specialization: 'Cardiology' });
    expect(res.status).toBe(200);
    expect(res.body.data.profile.name).toBe('Dr. Alice');
    expect(res.body.data.profile.specialization).toBe('Cardiology');
    expect(res.body.data.profile.verificationStatus).toBe('PENDING');
  });

  test('Updates existing professional profile', async () => {
    const token = await reg('PROFESSIONAL');
    await request(app).put('/api/professional/profile').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dr. Alice', specialization: 'Cardiology' });
    const res = await request(app).put('/api/professional/profile').set('Authorization', `Bearer ${token}`)
      .send({ qualification: 'MBBS, MD', experience: 10, licenseNumber: 'MED-12345' });
    expect(res.status).toBe(200);
    expect(res.body.data.profile.qualification).toBe('MBBS, MD');
    expect(res.body.data.profile.experience).toBe(10);
  });

  test('Saves consultation modes', async () => {
    const token = await reg('PROFESSIONAL');
    const res = await request(app).put('/api/professional/profile').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dr. B', specialization: 'Neurology', consultationModes: ['IN_PERSON', 'VIDEO'] });
    expect(res.status).toBe(200);
    expect(res.body.data.profile.consultationModes).toContain('VIDEO');
  });

  test('Cannot set verificationStatus directly', async () => {
    const token = await reg('PROFESSIONAL');
    await request(app).put('/api/professional/profile').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dr. Hack', specialization: 'Fraud', verificationStatus: 'APPROVED' });
    const profile = await request(app).get('/api/professional/profile').set('Authorization', `Bearer ${token}`);
    expect(profile.body.data.profile.verificationStatus).toBe('PENDING');
  });

  test('Returns 400 with no valid fields', async () => {
    const token = await reg('PROFESSIONAL');
    expect((await request(app).put('/api/professional/profile').set('Authorization', `Bearer ${token}`).send({})).status).toBe(400);
  });

  test('Returns 400 on first create without name+specialization', async () => {
    const token = await reg('PROFESSIONAL');
    expect((await request(app).put('/api/professional/profile').set('Authorization', `Bearer ${token}`).send({ qualification: 'MBBS' })).status).toBe(400);
  });
});

describe('GET /api/professional/associations', () => {
  test('Returns empty array when no profile exists', async () => {
    const token = await reg('PROFESSIONAL');
    const res = await request(app).get('/api/professional/associations').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.associations).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EXPERT TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe('GET /api/expert/profile', () => {
  test('Returns null when no profile exists', async () => {
    const token = await reg('EXPERT', 'expert2@example.com');
    const res = await request(app).get('/api/expert/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.profile).toBeNull();
  });

  test('Returns 401 without token', async () => {
    expect((await request(app).get('/api/expert/profile')).status).toBe(401);
  });

  test('Returns 403 for PROFESSIONAL role', async () => {
    const token = await reg('PROFESSIONAL');
    expect((await request(app).get('/api/expert/profile').set('Authorization', `Bearer ${token}`)).status).toBe(403);
  });
});

describe('PUT /api/expert/profile', () => {
  test('Creates expert profile on first call', async () => {
    const token = await reg('EXPERT', 'expert3@example.com');
    const res = await request(app).put('/api/expert/profile').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dr. Expert', specialization: 'Mental Health' });
    expect(res.status).toBe(200);
    expect(res.body.data.profile.specialization).toBe('Mental Health');
    expect(res.body.data.profile.verificationStatus).toBe('PENDING');
  });

  test('Updates expert profile', async () => {
    const token = await reg('EXPERT', 'expert4@example.com');
    await request(app).put('/api/expert/profile').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dr. Expert', specialization: 'Nutrition' });
    const res = await request(app).put('/api/expert/profile').set('Authorization', `Bearer ${token}`)
      .send({ qualification: 'PhD', experience: 15, bio: 'Expert in nutrition' });
    expect(res.status).toBe(200);
    expect(res.body.data.profile.qualification).toBe('PhD');
    expect(res.body.data.profile.experience).toBe(15);
    expect(res.body.data.profile.bio).toBe('Expert in nutrition');
  });

  test('Cannot set verificationStatus directly', async () => {
    const token = await reg('EXPERT', 'expert5@example.com');
    await request(app).put('/api/expert/profile').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hack Expert', specialization: 'Fraud', verificationStatus: 'APPROVED' });
    const res = await request(app).get('/api/expert/profile').set('Authorization', `Bearer ${token}`);
    expect(res.body.data.profile.verificationStatus).toBe('PENDING');
  });

  test('Returns 400 with no valid fields', async () => {
    const token = await reg('EXPERT', 'expert6@example.com');
    expect((await request(app).put('/api/expert/profile').set('Authorization', `Bearer ${token}`).send({})).status).toBe(400);
  });
});
