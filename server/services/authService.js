/**
 * authService — CarePath AI
 *
 * Business logic for authentication.
 * Called by authController; never called directly by route files.
 *
 * Responsibilities:
 *   - password hashing + comparison
 *   - JWT generation + verification
 *   - user registration
 *   - user login
 *   - current-user fetch
 */

'use strict';

const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const { User }  = require('../models');
const { ROLES, AUDIT_ACTIONS, AUDIT_RESOURCES } = require('../utils/constants');
const { AppError } = require('../middleware/errorHandler');
const logger    = require('../utils/logger');

// ── Constants ─────────────────────────────────────────────────────────────────
const BCRYPT_ROUNDS   = 12;
const JWT_SECRET      = () => process.env.JWT_SECRET;   // lazy so tests can set env first
const JWT_EXPIRES_IN  = () => process.env.JWT_EXPIRES_IN  || '7d';

// Roles that may self-register via the public endpoint.
// ADMIN is intentionally absent.
const PUBLIC_ROLES = [ROLES.USER, ROLES.HOSPITAL, ROLES.PROFESSIONAL, ROLES.EXPERT];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * hashPassword — bcrypt hash with fixed work factor.
 */
const hashPassword = async (plain) => {
  if (!plain) throw new AppError('Password is required', 400);
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
};

/**
 * comparePassword — safe timing-attack-resistant compare.
 */
const comparePassword = async (plain, hash) => bcrypt.compare(plain, hash);

/**
 * signToken — produces a JWT containing only userId and role.
 * Never include passwords, health data, or secrets in the payload.
 */
const signToken = (userId, role) => {
  const secret = JWT_SECRET();
  if (!secret) {
    throw new AppError('JWT_SECRET is not configured. Set it in your .env file.', 500);
  }
  return jwt.sign(
    { sub: userId.toString(), role },
    secret,
    { expiresIn: JWT_EXPIRES_IN(), issuer: 'carepath-ai' }
  );
};

/**
 * verifyToken — validates a JWT and returns its decoded payload.
 * Throws AppError on invalid/expired tokens.
 */
const verifyJWT = (token) => {
  const secret = JWT_SECRET();
  if (!secret) throw new AppError('JWT_SECRET is not configured.', 500);
  try {
    return jwt.verify(token, secret, { issuer: 'carepath-ai' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw new AppError('Token has expired', 401);
    throw new AppError('Invalid token', 401);
  }
};

/**
 * safeUser — strips all sensitive fields before returning to client.
 */
const safeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.__v;
  return obj;
};

// ── Registration ─────────────────────────────────────────────────────────────

/**
 * register — creates a new user account.
 *
 * Security:
 *   - Only PUBLIC_ROLES may self-register (no ADMIN via public endpoint).
 *   - Email is normalised (lowercase, trimmed).
 *   - Password is hashed before saving — never stored in plain text.
 *   - Duplicate email returns 409.
 */
const register = async ({ name, email, password, role, phone }) => {
  // 1. Guard: disallow ADMIN self-registration
  const normalizedRole = (role || ROLES.USER).toUpperCase();
  if (!PUBLIC_ROLES.includes(normalizedRole)) {
    throw new AppError('Registration for this role is not permitted via this endpoint', 403);
  }

  // 2. Normalise email
  const normalizedEmail = email.toLowerCase().trim();

  // 3. Check for duplicate
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new AppError('An account with this email address already exists', 409);
  }

  // 4. Hash password — NEVER store plain text
  const passwordHash = await hashPassword(password);

  // 5. Create user
  const user = await User.create({
    name:     name.trim(),
    email:    normalizedEmail,
    password: passwordHash,
    role:     normalizedRole,
    phone:    phone?.trim() || undefined,
    // Hospital, Professional, Expert start unverified
    isVerified: normalizedRole === ROLES.USER,
  });

  logger.info(`[AUTH] New ${normalizedRole} registered: ${normalizedEmail}`);

  // 6. Generate token
  const token = signToken(user._id, user.role);

  return { token, user: safeUser(user) };
};

// ── Login ─────────────────────────────────────────────────────────────────────

/**
 * login — authenticates a user and returns a JWT.
 *
 * Security:
 *   - Fetches password explicitly with `+password` (field is select:false).
 *   - Uses bcrypt.compare — timing-safe.
 *   - Inactive accounts are rejected before password check to avoid user enumeration
 *     (same generic error for "not found" and "wrong password").
 *   - lastLogin timestamp updated on success.
 */
const login = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Find user and include password hash
  const user = await User.findByEmailWithPassword(normalizedEmail);

  // 2. Constant-time rejection — same message for "not found" and "wrong password"
  //    to avoid user-enumeration attacks.
  const GENERIC_ERROR = 'Invalid email or password';

  if (!user) {
    // Still run a dummy compare to prevent timing attacks
    await bcrypt.compare(password, '$2b$12$dummyhashforthepurposeoftimingsafety.xxxxxxxxx');
    throw new AppError(GENERIC_ERROR, 401);
  }

  // 3. Check account is active
  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact support.', 403);
  }

  // 4. Compare password
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new AppError(GENERIC_ERROR, 401);
  }

  // 5. Update lastLogin (fire-and-forget, don't block response)
  User.findByIdAndUpdate(user._id, { lastLogin: new Date() }).catch((err) =>
    logger.warn(`[AUTH] Failed to update lastLogin for ${user._id}: ${err.message}`)
  );

  // 6. Generate token
  const token = signToken(user._id, user.role);

  logger.info(`[AUTH] Login successful: ${normalizedEmail} [${user.role}]`);

  return { token, user: safeUser(user) };
};

// ── Get Current User ──────────────────────────────────────────────────────────

/**
 * getMe — returns the authenticated user from DB.
 * userId comes from the verified JWT (req.user.sub), never from the client.
 */
const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new AppError('User not found or account inactive', 404);
  }
  return safeUser(user);
};

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  hashPassword,
  comparePassword,
  signToken,
  verifyJWT,
  safeUser,
  register,
  login,
  getMe,
};
