// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

// ── Helper: generate JWT ────────────────────────────────────────
const signToken = (user) =>
  jwt.sign(
    { id: user.id, user_code: user.user_code, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ── POST /api/auth/login ────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { user_code, password } = req.body;

    if (!user_code || !password) {
      return res.status(400).json({ success: false, message: 'User code and password are required.' });
    }

    // Find user by code or email
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE (user_code = ? OR email = ?) AND is_active = 1',
      [user_code, user_code]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Fetch extra profile based on role
    let profile = null;
    if (user.role === 'student') {
      const [s] = await db.execute(
        `SELECT s.*, c.name AS class_name, c.section
         FROM students s
         LEFT JOIN classes c ON s.class_id = c.id
         WHERE s.user_id = ?`,
        [user.id]
      );
      profile = s[0] || null;
    }

    const token = signToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id:        user.id,
        user_code: user.user_code,
        full_name: user.full_name,
        email:     user.email,
        role:      user.role,
        profile,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── POST /api/auth/register ─────────────────────────────────────
// Admin-only: create any user
exports.register = async (req, res) => {
  try {
    const { full_name, email, phone, password, role, extra } = req.body;
    // extra = { class_id, parent_id, date_of_birth, gender } for students

    if (!full_name || !password || !role) {
      return res.status(400).json({ success: false, message: 'full_name, password and role are required.' });
    }

    // Generate user_code
    const prefix = { student: 'STU', parent: 'PAR', teacher: 'TCH', admin: 'ADM' }[role] || 'USR';
    const year   = new Date().getFullYear();
    const [[{ count }]] = await db.execute('SELECT COUNT(*) AS count FROM users WHERE role = ?', [role]);
    const user_code = `${prefix}-${year}-${String(Number(count) + 1).padStart(3, '0')}`;

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      'INSERT INTO users (user_code, full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [user_code, full_name, email || null, phone || null, hashed, role]
    );

    const userId = result.insertId;

    // If registering a student, also create student record
    if (role === 'student' && extra) {
      const { class_id, parent_id, date_of_birth, gender, address } = extra;
      await db.execute(
        `INSERT INTO students (user_id, reg_number, class_id, parent_id, date_of_birth, gender, address)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, user_code, class_id || null, parent_id || null,
         date_of_birth || null, gender || null, address || null]
      );
    }

    res.status(201).json({
      success: true,
      message: `${role} registered successfully`,
      user_code,
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Email already exists.' });
    }
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/auth/me ────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, user_code, full_name, email, phone, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── PUT /api/auth/change-password ───────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];

    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
