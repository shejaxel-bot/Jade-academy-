// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('./db');

const ALLOWED_ROLES = new Set(['student', 'parent', 'teacher', 'admin']);
const PASSWORD_MIN_LENGTH = 8;

const signToken = (user) => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.');
  }

  return jwt.sign(
    { id: user.id, user_code: user.user_code, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d', algorithm: 'HS256' }
  );
};

const isValidEmail = (value) =>
  typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { user_code, password } = req.body || {};

    if (typeof user_code !== 'string' || !user_code.trim() ||
        typeof password !== 'string' || !password) {
      return res.status(400).json({ success: false, message: 'User code/email and password are required.' });
    }

    const [rows] = await db.execute(
      `SELECT id, user_code, full_name, email, phone, password, role, is_active
       FROM users
       WHERE (user_code = ? OR email = ?) AND is_active = 1
       LIMIT 1`,
      [user_code.trim(), user_code.trim()]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    let profile = null;
    if (user.role === 'student') {
      const [profiles] = await db.execute(
        `SELECT s.id AS student_id, s.reg_number, s.class_id,
                s.date_of_birth, s.gender, s.status,
                c.name AS class_name, c.section, c.academic_year
         FROM students s
         LEFT JOIN classes c ON s.class_id = c.id
         WHERE s.user_id = ?
         LIMIT 1`,
        [user.id]
      );
      profile = profiles[0] || null;
    }

    const token = signToken(user);
    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        user_code: user.user_code,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        profile,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/auth/register (administrator only; protected in routes)
exports.register = async (req, res) => {
  const { full_name, email, phone, password, role, extra } = req.body || {};

  if (typeof full_name !== 'string' || !full_name.trim() ||
      full_name.trim().length > 100 ||
      typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH ||
      !ALLOWED_ROLES.has(role)) {
    return res.status(400).json({
      success: false,
      message: 'A valid full_name, password of at least 8 characters, and supported role are required.'
    });
  }

  if (email !== undefined && email !== null && email !== '' && !isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'A valid email address is required.' });
  }

  if (phone !== undefined && phone !== null && (typeof phone !== 'string' || phone.length > 20)) {
    return res.status(400).json({ success: false, message: 'phone must be a string of at most 20 characters.' });
  }

  const studentDetails = extra && typeof extra === 'object' && !Array.isArray(extra) ? extra : {};
  if (role === 'student') {
    if (studentDetails.gender && !['male', 'female', 'other'].includes(studentDetails.gender)) {
      return res.status(400).json({ success: false, message: 'gender must be male, female, or other.' });
    }
    if (studentDetails.class_id && (!Number.isSafeInteger(Number(studentDetails.class_id)) || Number(studentDetails.class_id) < 1)) {
      return res.status(400).json({ success: false, message: 'class_id must be a positive integer.' });
    }
    if (studentDetails.parent_id && (!Number.isSafeInteger(Number(studentDetails.parent_id)) || Number(studentDetails.parent_id) < 1)) {
      return res.status(400).json({ success: false, message: 'parent_id must be a positive integer.' });
    }
  }

  let conn;
  try {
    const hashed = await bcrypt.hash(password, 12);
    const prefix = { student: 'STU', parent: 'PAR', teacher: 'TCH', admin: 'ADM' }[role];
    // Random suffix avoids COUNT(*) race conditions when two admins register users together.
    const userCode = `${prefix}-${new Date().getFullYear()}-${crypto.randomInt(100000, 1000000)}`;

    conn = await db.getConnection();
    await conn.beginTransaction();

    if (role === 'student' && studentDetails.parent_id) {
      const [parents] = await conn.execute(
        "SELECT id FROM users WHERE id = ? AND role = 'parent' AND is_active = 1 LIMIT 1",
        [Number(studentDetails.parent_id)]
      );
      if (!parents.length) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: 'parent_id must identify an active parent account.' });
      }
    }

    const [result] = await conn.execute(
      'INSERT INTO users (user_code, full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [userCode, full_name.trim(), email || null, phone || null, hashed, role]
    );

    if (role === 'student') {
      await conn.execute(
        `INSERT INTO students (user_id, reg_number, class_id, parent_id, date_of_birth, gender, address)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          result.insertId,
          userCode,
          studentDetails.class_id ? Number(studentDetails.class_id) : null,
          studentDetails.parent_id ? Number(studentDetails.parent_id) : null,
          studentDetails.date_of_birth || null,
          studentDetails.gender || null,
          studentDetails.address || null,
        ]
      );
    }

    await conn.commit();
    return res.status(201).json({
      success: true,
      message: `${role} registered successfully`,
      user_code: userCode,
    });
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (rollbackError) {
        console.error('Registration rollback failed:', rollbackError);
      }
    }

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Email or generated user code already exists. Please retry.' });
    }
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    if (conn) conn.release();
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, user_code, full_name, email, phone, role, created_at FROM users WHERE id = ? AND is_active = 1',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body || {};

    if (typeof current_password !== 'string' || !current_password ||
        typeof new_password !== 'string' || new_password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({
        success: false,
        message: 'Current password and a new password of at least 8 characters are required.'
      });
    }

    const [rows] = await db.execute(
      'SELECT password FROM users WHERE id = ? AND is_active = 1 LIMIT 1',
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(current_password, rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hashed = await bcrypt.hash(new_password, 12);
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);

    return res.json({ success: true, message: 'Password changed successfully. Please sign in again.' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
