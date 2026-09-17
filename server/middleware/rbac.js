/**
 * RBAC middleware — CarePath AI
 *
 * Server-side role-based access control.
 * Must be used AFTER verifyToken (which sets req.user).
 *
 * Usage:
 *   router.get('/admin-only', verifyToken, requireRole('ADMIN'), handler)
 *   router.post('/hospital-or-admin', verifyToken, requireRole('HOSPITAL', 'ADMIN'), handler)
 *
 * Security:
 *   - Role is read from req.user (set by verifyToken from the verified JWT).
 *   - Role is NEVER read from req.body, req.query, or req.params.
 *   - Changing the role in localStorage/frontend has zero effect on server authorization.
 */

'use strict';

const { AppError } = require('./errorHandler');

/**
 * requireRole — factory that returns middleware checking req.user.role.
 *
 * @param {...string} roles — one or more allowed roles
 * @returns Express middleware
 *
 * @example
 *   requireRole('ADMIN')
 *   requireRole('HOSPITAL', 'ADMIN')
 */
const requireRole = (...roles) => (req, res, next) => {
  // req.user must be set by verifyToken before this middleware runs.
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (!roles.includes(req.user.role)) {
    return next(
      new AppError(
        `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
        403
      )
    );
  }

  next();
};

module.exports = { requireRole };
