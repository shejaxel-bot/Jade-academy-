// middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('./db');

// Verify the token and confirm the account is still active.
// Checking updated_at also invalidates tokens issued before an account update
// (including password changes) without requiring a separate token table.
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized. No token.' });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. No token.' });
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET is missing or too short.');
    return res.status(500).json({ success: false, message: 'Authentication is not configured.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

    if (!decoded.id || !decoded.role || !decoded.iat) {
      return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
    }

    const [rows] = await db.execute(
      'SELECT id, role, is_active, updated_at FROM users WHERE id = ? LIMIT 1',
      [decoded.id]
    );

    if (!rows.length || !rows[0].is_active || rows[0].role !== decoded.role) {
      return res.status(401).json({ success: false, message: 'Account is unavailable. Please sign in again.' });
    }

    const updatedAt = Math.floor(new Date(rows[0].updated_at).getTime() / 1000);
    if (Number.isFinite(updatedAt) && decoded.iat < updatedAt) {
      return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
    }

    req.user = decoded;
    return next();
  } catch (err) {
    if (err.name !== 'JsonWebTokenError' && err.name !== 'TokenExpiredError' && err.name !== 'NotBeforeError') {
      console.error('Authentication check failed:', err);
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
    return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
  }
};

// Role-based access guard. Usage: authorize('admin', 'teacher')
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${roles.join(' or ')}.`
    });
  }
  return next();
};

module.exports = { protect, authorize };
