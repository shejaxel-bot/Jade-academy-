// Centralized authorization for student records.
// The active database schema stores the linked parent account in students.parent_id
// and the student's account in students.user_id.

const db = require('./db');

const positiveId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const requireStudentAccess = (parameterName = 'id') => async (req, res, next) => {
  const studentId = positiveId(req.params[parameterName]);

  if (!studentId) {
    return res.status(400).json({ success: false, message: 'A valid student ID is required.' });
  }

  try {
    const { id: userId, role } = req.user;

    if (role === 'admin') {
      req.studentId = studentId;
      return next();
    }

    let sql;
    let params;

    if (role === 'student') {
      sql = 'SELECT id FROM students WHERE id = ? AND user_id = ? LIMIT 1';
      params = [studentId, userId];
    } else if (role === 'parent') {
      sql = 'SELECT id FROM students WHERE id = ? AND parent_id = ? LIMIT 1';
      params = [studentId, userId];
    } else if (role === 'teacher') {
      sql = `SELECT s.id
             FROM students s
             WHERE s.id = ?
               AND (
                 EXISTS (
                   SELECT 1 FROM classes c
                   WHERE c.id = s.class_id AND c.teacher_id = ?
                 )
                 OR EXISTS (
                   SELECT 1 FROM class_subjects cs
                   WHERE cs.class_id = s.class_id AND cs.teacher_id = ?
                 )
               )
             LIMIT 1`;
      params = [studentId, userId, userId];
    } else {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const [rows] = await db.execute(sql, params);
    if (!rows.length) {
      // Use 404 for both missing and unauthorized records to avoid ID enumeration.
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    req.studentId = studentId;
    return next();
  } catch (err) {
    console.error('Student access check failed:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Resolve the authenticated student's database ID. User IDs and student IDs
// are separate primary keys and must never be assumed to be equal.
const resolveOwnStudentId = async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT id FROM students WHERE user_id = ? LIMIT 1',
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    req.studentId = rows[0].id;
    req.params.id = String(rows[0].id);
    req.params.studentId = String(rows[0].id);
    return next();
  } catch (err) {
    console.error('Own student lookup failed:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};


const requireClassAccess = (parameterName = 'classId') => async (req, res, next) => {
  const classId = positiveId(req.params[parameterName]);

  if (!classId) {
    return res.status(400).json({ success: false, message: 'A valid class ID is required.' });
  }

  if (req.user.role === 'admin') {
    req.classId = classId;
    return next();
  }

  if (req.user.role !== 'teacher') {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT id FROM classes
       WHERE id = ?
         AND (
           teacher_id = ?
           OR EXISTS (
             SELECT 1 FROM class_subjects cs
             WHERE cs.class_id = classes.id AND cs.teacher_id = ?
           )
         )
       LIMIT 1`,
      [classId, req.user.id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    req.classId = classId;
    return next();
  } catch (err) {
    console.error('Class access check failed:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { requireStudentAccess, resolveOwnStudentId, requireClassAccess };
