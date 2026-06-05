// controllers/attendanceController.js
const db = require('../config/db');

// ── POST /api/attendance ────────────────────────────────────────
// Teacher marks attendance for a student
exports.markAttendance = async (req, res) => {
  try {
    const { student_id, class_id, date, status, notes } = req.body;

    if (!student_id || !class_id || !date || !status) {
      return res.status(400).json({ success: false, message: 'student_id, class_id, date and status are required.' });
    }

    await db.execute(
      `INSERT INTO attendance (student_id, class_id, date, status, notes, marked_by)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), notes = VALUES(notes), marked_by = VALUES(marked_by)`,
      [student_id, class_id, date, status, notes || null, req.user.id]
    );

    res.status(201).json({ success: true, message: 'Attendance marked.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── POST /api/attendance/bulk ───────────────────────────────────
// Teacher marks attendance for entire class in one request
exports.markBulkAttendance = async (req, res) => {
  try {
    const { class_id, date, records } = req.body;
    // records = [{ student_id, status, notes }]

    if (!class_id || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'class_id, date and records[] are required.' });
    }

    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
      for (const r of records) {
        await conn.execute(
          `INSERT INTO attendance (student_id, class_id, date, status, notes, marked_by)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE status = VALUES(status), notes = VALUES(notes), marked_by = VALUES(marked_by)`,
          [r.student_id, class_id, date, r.status || 'present', r.notes || null, req.user.id]
        );
      }
      await conn.commit();
      res.json({ success: true, message: `Attendance marked for ${records.length} student(s).` });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/attendance/class/:classId ─────────────────────────
// Get attendance for a class on a specific date
exports.getClassAttendance = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) return res.status(400).json({ success: false, message: 'date query param is required.' });

    const [rows] = await db.execute(
      `SELECT s.id AS student_id, s.reg_number, u.full_name,
              COALESCE(a.status, 'not_marked') AS status, a.notes
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ?
       WHERE s.class_id = ?
       ORDER BY u.full_name`,
      [date, req.params.classId]
    );

    const summary = rows.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    res.json({ success: true, date, summary, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/attendance/student/:studentId/summary ──────────────
// Attendance summary for a student (e.g. for a full term)
exports.getStudentAttendanceSummary = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const params = [req.params.studentId];
    let dateFilter = '';
    if (start_date && end_date) {
      dateFilter = 'AND a.date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    const [rows] = await db.execute(
      `SELECT a.date, a.status, a.notes
       FROM attendance a
       WHERE a.student_id = ? ${dateFilter}
       ORDER BY a.date DESC`,
      params
    );

    const summary = rows.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
      return acc;
    }, {});

    const attendance_rate = summary.total
      ? (((summary.present || 0) + (summary.late || 0)) / summary.total * 100).toFixed(1)
      : 0;

    res.json({ success: true, summary: { ...summary, attendance_rate: `${attendance_rate}%` }, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
