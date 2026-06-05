// controllers/studentController.js
const db = require('../config/db');

// ── GET /api/students ───────────────────────────────────────────
// Admin & teachers can list all students
exports.getAllStudents = async (req, res) => {
  try {
    const { class_id, status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (class_id) { conditions.push('s.class_id = ?');  params.push(class_id); }
    if (status)   { conditions.push('s.status = ?');     params.push(status); }
    if (search)   {
      conditions.push('(u.full_name LIKE ? OR s.reg_number LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [students] = await db.execute(
      `SELECT s.id, s.reg_number, u.full_name, u.email, u.phone,
              c.name AS class_name, c.section,
              s.gender, s.date_of_birth, s.status, s.admission_date
       FROM students s
       JOIN users u   ON s.user_id  = u.id
       LEFT JOIN classes c ON s.class_id = c.id
       ${where}
       ORDER BY u.full_name
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM students s
       JOIN users u ON s.user_id = u.id ${where}`,
      params
    );

    res.json({ success: true, total, page: Number(page), data: students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/students/:id ───────────────────────────────────────
exports.getStudent = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT s.*, u.full_name, u.email, u.phone, u.user_code,
              c.name AS class_name, c.section, c.academic_year,
              pu.full_name AS parent_name, pu.phone AS parent_phone
       FROM students s
       JOIN users u         ON s.user_id   = u.id
       LEFT JOIN classes c  ON s.class_id  = c.id
       LEFT JOIN users pu   ON s.parent_id = pu.id
       WHERE s.id = ?`,
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ success: false, message: 'Student not found.' });

    // Also get current term grades summary
    const [grades] = await db.execute(
      `SELECT sub.name AS subject, g.term, g.cat_score, g.exam_score,
              g.total_score, g.grade_letter, g.academic_year
       FROM grades g
       JOIN subjects sub ON g.subject_id = sub.id
       WHERE g.student_id = ?
       ORDER BY g.academic_year DESC, g.term, sub.name`,
      [rows[0].id]
    );

    res.json({ success: true, data: { ...rows[0], grades } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/students/me ────────────────────────────────────────
// Student accessing their own profile
exports.getMyProfile = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT s.*, u.full_name, u.email, u.phone, u.user_code,
              c.name AS class_name, c.section, c.academic_year
       FROM students s
       JOIN users u        ON s.user_id  = u.id
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.user_id = ?`,
      [req.user.id]
    );

    if (!rows.length) return res.status(404).json({ success: false, message: 'Profile not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── PUT /api/students/:id ───────────────────────────────────────
exports.updateStudent = async (req, res) => {
  try {
    const { class_id, date_of_birth, gender, address, status } = req.body;

    await db.execute(
      `UPDATE students SET
         class_id      = COALESCE(?, class_id),
         date_of_birth = COALESCE(?, date_of_birth),
         gender        = COALESCE(?, gender),
         address       = COALESCE(?, address),
         status        = COALESCE(?, status)
       WHERE id = ?`,
      [class_id, date_of_birth, gender, address, status, req.params.id]
    );

    res.json({ success: true, message: 'Student updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/students/:id/attendance ───────────────────────────
exports.getAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const params = [req.params.id];
    let dateFilter = '';

    if (month && year) {
      dateFilter = 'AND MONTH(a.date) = ? AND YEAR(a.date) = ?';
      params.push(month, year);
    }

    const [rows] = await db.execute(
      `SELECT a.date, a.status, a.notes
       FROM attendance a
       WHERE a.student_id = ? ${dateFilter}
       ORDER BY a.date DESC`,
      params
    );

    // Summary
    const summary = rows.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    res.json({ success: true, summary, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
