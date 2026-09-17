/**
 * user.test.js — CarePath AI
 *
 * Stage 6 tests for the User profile API endpoints.
 * Tests: GET /api/user/profile, PUT /api/user/profile,
 *        PUT /api/user/health-profile, PUT /api/user/consent
 */

'use strict';

const request  = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET     = 'test-secret-carepath-ai-stage6';
process.env.JWT_EXPIRES_IN = '1h';
process.env.NODE_ENV       = 'test';
process.env.CLIENT_URL     = 'http://localhost:5173';

jest.setTimeout(30000);

const app = require('../server');
const { User } = require('../models');

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
});

// ── Helper: register and get token ────────────────────────────────────────────
const register = async (overrides = {}) => {
  const body = {
    name: 'Alice Patient', email: 'alice@example.com',
    password: 'Password1', role: 'USER',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(body);
  return res.body.data.token;
};

// ── GET /api/user/profile ─────────────────────────────────────────────────────
describe('GET /api/user/profile', () => {
  test('Returns the user profile for authenticated USER', async () => {
    const token = await register();
    const res = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('alice@example.com');
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('Returns 401 without token', async () => {
    const res = await request(app).get('/api/user/profile');
    expect(res.status).toBe(401);
  });

  test('Returns 403 for non-USER role (HOSPITAL)', async () => {
    const token = await register({ email: 'hosp@example.com', role: 'HOSPITAL' });
    const res = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

// ── PUT /api/user/profile ─────────────────────────────────────────────────────
describe('PUT /api/user/profile', () => {
  test('Updates name and phone successfully', async () => {
    const token = await register();
    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Alice Updated', phone: '+1 555 123 4567' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('Alice Updated');
    expect(res.body.data.user.phone).toBe('+1 555 123 4567');
  });

  test('Updates gender and language', async () => {
    const token = await register();
    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ gender: 'FEMALE', language: 'fr' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.gender).toBe('FEMALE');
    expect(res.body.data.user.language).toBe('fr');
  });

  test('Updates location fields', async () => {
    const token = await register();
    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ location: { city: 'London', state: 'England', country: 'UK' } });
    expect(res.status).toBe(200);
    expect(res.body.data.user.location.city).toBe('London');
    expect(res.body.data.user.location.country).toBe('UK');
  });

  test('Rejects invalid gender value', async () => {
    const token = await register();
    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ gender: 'INVALID' });
    expect(res.status).toBe(400);
  });

  test('Returns 400 when no valid fields provided', async () => {
    const token = await register();
    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  test('Cannot update role via profile endpoint', async () => {
    const token = await register();
    await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'ADMIN', name: 'Hacker' });
    // Role must remain USER
    const profile = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(profile.body.data.user.role).toBe('USER');
  });

  test('Returns 401 without token', async () => {
    const res = await request(app).put('/api/user/profile').send({ name: 'X' });
    expect(res.status).toBe(401);
  });
});

// ── PUT /api/user/health-profile ─────────────────────────────────────────────
describe('PUT /api/user/health-profile', () => {
  test('Updates blood type and allergies', async () => {
    const token = await register();
    const res = await request(app)
      .put('/api/user/health-profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ bloodType: 'O+', allergies: ['Penicillin', 'Peanuts'] });
    expect(res.status).toBe(200);
    expect(res.body.data.user.healthProfile.bloodType).toBe('O+');
    expect(res.body.data.user.healthProfile.allergies).toContain('Penicillin');
  });

  test('Updates emergency contact', async () => {
    const token = await register();
    const res = await request(app)
      .put('/api/user/health-profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        emergencyContact: {
          name: 'Bob Smith', phone: '+1 555 999 0000', relationship: 'Spouse',
        },
      });
    expect(res.status).toBe(200);
    expect(res.body.data.user.healthProfile.emergencyContact.name).toBe('Bob Smith');
  });

  test('Returns 400 with no valid fields', async () => {
    const token = await register();
    const res = await request(app)
      .put('/api/user/health-profile')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

// ── PUT /api/user/consent ─────────────────────────────────────────────────────
describe('PUT /api/user/consent', () => {
  test('Updates consent preferences', async () => {
    const token = await register();
    const res = await request(app)
      .put('/api/user/consent')
      .set('Authorization', `Bearer ${token}`)
      .send({
        healthDataStorage: true,
        reportAnalysis:    true,
        personalization:   true,
        expertSharing:     false,
        hospitalSharing:   false,
        notifications:     true,
      });
    expect(res.status).toBe(200);
    expect(res.body.data.user.consent.healthDataStorage).toBe(true);
    expect(res.body.data.user.consent.expertSharing).toBe(false);
  });

  test('Rejects non-boolean consent field', async () => {
    const token = await register();
    const res = await request(app)
      .put('/api/user/consent')
      .set('Authorization', `Bearer ${token}`)
      .send({ notifications: 'yes' });
    expect(res.status).toBe(400);
  });

  test('Returns 400 with no valid consent fields', async () => {
    const token = await register();
    const res = await request(app)
      .put('/api/user/consent')
      .set('Authorization', `Bearer ${token}`)
      .send({ unknownField: true });
    expect(res.status).toBe(400);
  });
});
