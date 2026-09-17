/**
 * hospital.test.js — CarePath AI
 *
 * Stage 7 tests for the Hospital profile API endpoints.
 * Tests: GET /api/hospital/profile, PUT /api/hospital/profile,
 *        GET /api/hospital/doctors
 */

'use strict';

const request  = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET     = 'test-secret-carepath-ai-stage7';
process.env.JWT_EXPIRES_IN = '1h';
process.env.NODE_ENV       = 'test';
process.env.CLIENT_URL     = 'http://localhost:5173';

jest.setTimeout(30000);

const app = require('../server');
const { User, Hospital, Professional } = require('../models');

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
  await Hospital.deleteMany({});
  await Professional.deleteMany({});
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const registerHospital = async (email = 'hospital@example.com') => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'City Hospital', email, password: 'Password1', role: 'HOSPITAL',
  });
  return res.body.data.token;
};

const registerUser = async (email = 'user@example.com') => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Test User', email, password: 'Password1', role: 'USER',
  });
  return res.body.data.token;
};

// ── GET /api/hospital/profile ─────────────────────────────────────────────────
describe('GET /api/hospital/profile', () => {
  test('Returns null hospital when no profile exists yet', async () => {
    const token = await registerHospital();
    const res = await request(app)
      .get('/api/hospital/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.hospital).toBeNull();
  });

  test('Returns 401 without token', async () => {
    const res = await request(app).get('/api/hospital/profile');
    expect(res.status).toBe(401);
  });

  test('Returns 403 for USER role', async () => {
    const token = await registerUser();
    const res = await request(app)
      .get('/api/hospital/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

// ── PUT /api/hospital/profile ─────────────────────────────────────────────────
describe('PUT /api/hospital/profile', () => {
  test('Creates hospital profile (upsert on first call)', async () => {
    const token = await registerHospital();
    const res = await request(app)
      .put('/api/hospital/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'City General Hospital', email: 'contact@city.com' });
    expect(res.status).toBe(200);
    expect(res.body.data.hospital.name).toBe('City General Hospital');
    expect(res.body.data.hospital.verificationStatus).toBe('PENDING');
  });

  test('Updates existing hospital profile', async () => {
    const token = await registerHospital();
    // Create first
    await request(app)
      .put('/api/hospital/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'City General', email: 'contact@city.com' });
    // Update
    const res = await request(app)
      .put('/api/hospital/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'City General Updated', phone: '+1 555 999 0000', city: 'London' });
    expect(res.status).toBe(200);
    expect(res.body.data.hospital.name).toBe('City General Updated');
    expect(res.body.data.hospital.city).toBe('London');
  });

  test('Sets emergencyAvailable correctly', async () => {
    const token = await registerHospital();
    const res = await request(app)
      .put('/api/hospital/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'ER Hospital', email: 'er@hospital.com', emergencyAvailable: true });
    expect(res.status).toBe(200);
    expect(res.body.data.hospital.emergencyAvailable).toBe(true);
  });

  test('Saves specialties array', async () => {
    const token = await registerHospital();
    const res = await request(app)
      .put('/api/hospital/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Spec Hospital', email: 'spec@hospital.com', specialties: ['Cardiology', 'Neurology'] });
    expect(res.status).toBe(200);
    expect(res.body.data.hospital.specialties).toContain('Cardiology');
    expect(res.body.data.hospital.specialties).toContain('Neurology');
  });

  test('Cannot update verificationStatus via profile endpoint', async () => {
    const token = await registerHospital();
    await request(app)
      .put('/api/hospital/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hack Hospital', email: 'hack@hospital.com', verificationStatus: 'APPROVED' });
    // Fetch and confirm status is still PENDING
    const profile = await request(app)
      .get('/api/hospital/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(profile.body.data.hospital.verificationStatus).toBe('PENDING');
  });

  test('Returns 400 when no valid fields provided', async () => {
    const token = await registerHospital();
    const res = await request(app)
      .put('/api/hospital/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  test('Returns 400 on first create without name + email', async () => {
    const token = await registerHospital();
    const res = await request(app)
      .put('/api/hospital/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ city: 'London' }); // no name/email
    expect(res.status).toBe(400);
  });

  test('Returns 401 without token', async () => {
    const res = await request(app).put('/api/hospital/profile').send({ name: 'X' });
    expect(res.status).toBe(401);
  });
});

// ── GET /api/hospital/doctors ─────────────────────────────────────────────────
describe('GET /api/hospital/doctors', () => {
  test('Returns empty array when no profile exists', async () => {
    const token = await registerHospital();
    const res = await request(app)
      .get('/api/hospital/doctors')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.doctors).toEqual([]);
  });

  test('Returns 401 without token', async () => {
    const res = await request(app).get('/api/hospital/doctors');
    expect(res.status).toBe(401);
  });
});
