/**
 * Authentication middleware — CarePath AI
 *
 * Verifies the JWT from the Authorization header and attaches
 * the decoded payload to req.user.
 *
 * Usage:
 *   router.get('/protected', verifyToken, handler)
 *
 * req.user after successful verification:
 *   { sub: <userId string>, role: <ROLE string>, iat, exp, iss }
 *
 * Security guarantees:
 *   - Token must be present (401 if missing).
 *   - Token must be signed with JWT_SECRET (401 if tampered).
 *   - Token must not be expired (401 if expired).
 *   - role in req.user comes from the VERIFIED JWT — never from req.body/query.
 */

'use strict';

const { verifyJWT } = require('../services/authService');
const { AppError }  = require('./errorHandler');

/**
 * verifyToken middleware.
 * Reads `Authorization: Bearer <token>` header.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Please provide a valid token.', 401));
  }

  const token = authHeader.split(' ')[1];

  if (!token || token === 'undefined' || token === 'null') {
    return next(new AppError('Authentication required. Token is missing or malformed.', 401));
  }

  try {
    // verifyJWT throws AppError on invalid/expired tokens
    const decoded = verifyJWT(token);
    req.user = decoded;  // { sub, role, iat, exp, iss }
    next();
  } catch (err) {
    next(err);  // AppError with 401 propagates to errorHandler
  }
};

module.exports = { verifyToken };
