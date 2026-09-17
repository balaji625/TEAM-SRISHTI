/**
 * auth.test.js — CarePath AI
 *
 * Stage 4 authentication + RBAC test suite.
 * Uses Jest + Supertest + mongodb-memory-server (in-memory MongoDB — no live DB needed).
 *
 * Covers all 17 verification requirements from the Stage 4 spec.
 */

'use strict';

const request  = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

// Set env before requiring app
process.env.JWT_SECRET      = 'test-secret-carepath-ai-stage4';
process.env.JWT_EXPIRES_IN  = '1h';
process.env.NODE_ENV        = 'test';
process.env.CLIENT_URL      = 'http://localhost:5173';

// Increase per-test timeout for tests that involve bcrypt + real Atlas connection
jest.setTimeout(30000);

const app = require('../server');
const { User } = require('../models');

// ── In-memory MongoDB setup ───────────────────────────────────────────────────
let mongod;

beforeAll(async () => {
  // Disconnect any existing connection (e.g. from the real MONGODB_URI in .env)
  // before connecting to the in-memory server.
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  // Clean up users between tests
  await User.deleteMany({});
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const validUser = {
  name:     'Test User',
  email:    'testuser@example.com',
  password: 'Password1',
  role:     'USER',
};

const registerAndLogin = async (data = validUser) => {
  await request(app).post('/api/auth/register').send(data);
  const res = await request(app).post('/api/auth/login').send({
    email:    data.email,
    password: data.password,
  });
  return res.body.data.token;
};

// ── Registration tests ────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {

  test('1. Valid USER registration succeeds', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('2. Duplicate email is rejected with 409', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('3. Missing name returns 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...validUser, name: '' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('3. Invalid email returns 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...validUser, email: 'notanemail' });
    expect(res.status).toBe(400);
  });

  test('3. Short password returns 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...validUser, password: 'abc' });
    expect(res.status).toBe(400);
  });

  test('3. Password without uppercase returns 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...validUser, password: 'password1' });
    expect(res.status).toBe(400);
  });

  test('4. Password is stored hashed (not plain text)', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const userInDb = await User.findOne({ email: validUser.email }).select('+password');
    expect(userInDb.password).not.toBe(validUser.password);
    const isHash = await bcrypt.compare(validUser.password, userInDb.password);
    expect(isHash).toBe(true);
  });

  test('12. Public registration cannot create ADMIN', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...validUser, role: 'ADMIN' });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('12. Public registration cannot create ADMIN (lowercase)', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...validUser, role: 'admin' });
    expect(res.status).toBe(403);
  });

  test('Can register as HOSPITAL', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...validUser, role: 'HOSPITAL', email: 'hosp@example.com' });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('HOSPITAL');
  });

  test('Can register as PROFESSIONAL', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...validUser, role: 'PROFESSIONAL', email: 'prof@example.com' });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('PROFESSIONAL');
  });

  test('Can register as EXPERT', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...validUser, role: 'EXPERT', email: 'expert@example.com' });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('EXPERT');
  });

  test('Response never contains password hash', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('$2b$');
    expect(body).not.toContain('$2a$');
    expect(res.body.data.user.password).toBeUndefined();
  });
});

// ── Login tests ───────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {

  test('5. Valid login succeeds with token', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/login').send({
      email:    validUser.email,
      password: validUser.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.role).toBe('USER');
  });

  test('6. Wrong password returns 401', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/login').send({
      email:    validUser.email,
      password: 'WrongPassword9',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('6. Non-existent email returns 401 (same message — no user enumeration)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email:    'nobody@example.com',
      password: 'Password1',
    });
    expect(res.status).toBe(401);
  });

  test('Login response never contains password hash', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/login').send({
      email: validUser.email, password: validUser.password,
    });
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('$2b$');
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('Token payload contains userId (sub) and role — no sensitive data', async () => {
    const token = await registerAndLogin();
    const decoded = jwt.decode(token);
    expect(decoded.sub).toBeTruthy();
    expect(decoded.role).toBe('USER');
    expect(decoded.password).toBeUndefined();
    expect(decoded.email).toBeUndefined();
  });
});

// ── GET /api/auth/me tests ────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {

  test('10. Valid JWT returns current user', async () => {
    const token = await registerAndLogin();
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('11. No JWT returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('8. Invalid JWT returns 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer this.is.invalid');
    expect(res.status).toBe(401);
  });

  test('9. Expired JWT returns 401', async () => {
    // Sign a token that's already expired
    const expiredToken = jwt.sign(
      { sub: new mongoose.Types.ObjectId().toString(), role: 'USER' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s', issuer: 'carepath-ai' }
    );
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  test('7. Missing Authorization header returns 401', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', '');
    expect(res.status).toBe(401);
  });
});

// ── RBAC tests ────────────────────────────────────────────────────────────────
describe('RBAC — /api/test/* routes', () => {

  const makeToken = (role) => {
    return jwt.sign(
      { sub: new mongoose.Types.ObjectId().toString(), role },
      process.env.JWT_SECRET,
      { expiresIn: '1h', issuer: 'carepath-ai' }
    );
  };

  test('13. USER cannot access ADMIN-protected endpoint', async () => {
    const token = makeToken('USER');
    const res = await request(app)
      .get('/api/test/admin-only')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('14. HOSPITAL cannot access ADMIN-protected endpoint', async () => {
    const token = makeToken('HOSPITAL');
    const res = await request(app)
      .get('/api/test/admin-only')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('15. PROFESSIONAL cannot access ADMIN-protected endpoint', async () => {
    const token = makeToken('PROFESSIONAL');
    const res = await request(app)
      .get('/api/test/admin-only')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('16. EXPERT cannot access ADMIN-protected endpoint', async () => {
    const token = makeToken('EXPERT');
    const res = await request(app)
      .get('/api/test/admin-only')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('17. ADMIN can access ADMIN-protected endpoint', async () => {
    const token = makeToken('ADMIN');
    const res = await request(app)
      .get('/api/test/admin-only')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('ADMIN');
  });

  test('USER can access USER-only endpoint', async () => {
    const token = makeToken('USER');
    const res = await request(app)
      .get('/api/test/user-only')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('HOSPITAL cannot access USER-only endpoint', async () => {
    const token = makeToken('HOSPITAL');
    const res = await request(app)
      .get('/api/test/user-only')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('Any authenticated user can access any-auth endpoint', async () => {
    for (const role of ['USER', 'HOSPITAL', 'PROFESSIONAL', 'EXPERT', 'ADMIN']) {
      const token = makeToken(role);
      const res = await request(app)
        .get('/api/test/any-auth')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    }
  });

  test('Unauthenticated request to any-auth returns 401', async () => {
    const res = await request(app).get('/api/test/any-auth');
    expect(res.status).toBe(401);
  });
});
