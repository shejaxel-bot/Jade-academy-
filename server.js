// server.js  –  Main entry point
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const routes     = require('./index');
const db         = require('./db');

const app  = express();

// Render and other reverse proxies forward the original client IP.
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// ── Security Middleware ─────────────────────────────────────────
app.use(helmet());

const configuredClientOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedClientOrigins = new Set([
  ...configuredClientOrigins,
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

app.use(cors({
  origin(origin, callback) {
    // Requests without an Origin header (for example, local health checks) are allowed.
    if (!origin || allowedClientOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by the CORS policy.'));
  },
  credentials: true,
}));

// Rate limiter: 100 requests per 15 min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  { success: false, message: 'Too many requests. Please try again later.' },
}));

// Stricter limiter on auth routes (10 attempts per 15 min)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});
app.use('/api/auth/login', authLimiter);

// ── Body Parser ─────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Health Check ────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'School Management API is running ✅',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ── API Routes ──────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 Handler ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global Error Handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
  });
});

// Start only when executed directly; importing the app in tests has no side effects.
const startServer = async () => {
  try {
    await db.ready;
    const server = app.listen(PORT, () => {
      console.log(`School Management API listening on port ${PORT} (${process.env.NODE_ENV || 'development'}).`);
    });
    return server;
  } catch (err) {
    console.error('Server startup aborted because the database is unavailable.');
    process.exitCode = 1;
    return null;
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
