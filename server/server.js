/**
 * CarePath AI — Express Server Entry Point
 * Stage 4: Authentication + RBAC routes added
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

// Use Google DNS for MongoDB Atlas SRV resolution
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Load backend secrets from this server's environment file regardless of cwd.
// The checked-in process environment must not override the server secret file.
dotenv.config({ path: path.join(__dirname, '.env'), override: true });

const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { connectDB } = require('./config/db');

// ── Register all Mongoose models before any routes run ────────────────────────
require('./models');   // side-effect: registers User, Hospital, etc. with Mongoose

// ── Route imports (will grow each stage) ──────────────────────────────────────
const healthRoutes        = require('./routes/health');
const authRoutes          = require('./routes/auth');
const userRoutes          = require('./routes/user');
const hospitalRoutes      = require('./routes/hospital');
const professionalRoutes  = require('./routes/professional');
const expertRoutes        = require('./routes/expert');
const adminRoutes         = require('./routes/admin');
const searchRoutes        = require('./routes/search');
const testRbacRoutes      = require('./routes/testRbac');

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ── Allowed CORS origins ───────────────────────────────────────────────────────
// Always includes: the CLIENT_URL env var + Netlify deployment + localhost dev.
// Add extra origins via CLIENT_URL_EXTRA (comma-separated) if needed.
const ALLOWED_ORIGINS = [
  CLIENT_URL,
  'https://ibm-carepath-ecosystem.netlify.app', // Netlify frontend (current deploy)
  'https://genuine-peony-66b7a6.netlify.app',   // Netlify frontend (previous deploy)
  'http://localhost:5173',
  'http://localhost:4173',                        // local Vite preview
  ...(process.env.CLIENT_URL_EXTRA
    ? process.env.CLIENT_URL_EXTRA.split(',').map((u) => u.trim())
    : []),
].filter(Boolean);

// ── Security middleware ────────────────────────────────────────────────────────
app.use(helmet());

// CORS — allow all configured frontend origins
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no Origin header (server-to-server, curl, Postman)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting — global fallback limiter (disabled in test environment)
if (process.env.NODE_ENV !== 'test') {
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
  });
  app.use(globalLimiter);
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Static file serving for uploads (local dev)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/health',        healthRoutes);
app.use('/api/auth',          authRoutes);
app.use('/api/user',          userRoutes);
app.use('/api/hospital',      hospitalRoutes);
app.use('/api/professional',  professionalRoutes);
app.use('/api/expert',        expertRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/search',        searchRoutes);

// Test RBAC routes — only active in non-production (guarded inside the route file too)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/test', testRbacRoutes);
}

// ── 404 + Global Error Handler ─────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start server ───────────────────────────────────────────────────────────────
const startServer = async () => {
  // Connect to MongoDB if MONGODB_URI is provided.
  // If not set, server still starts for health-check / model-validation purposes.
  if (process.env.MONGODB_URI) {
    await connectDB();
  } else {
    logger.warn('MONGODB_URI not set — server running WITHOUT database connection.');
    logger.warn('Set MONGODB_URI in your .env file to enable database features.');
  }

  app.listen(PORT, () => {
    logger.info(`CarePath AI server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    logger.info(`CORS allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
  });
};

// Only auto-start when run directly (node server.js), not when required by tests
if (require.main === module) {
  startServer();
}

module.exports = app; // export for testing
