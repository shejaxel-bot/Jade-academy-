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
                 
               )
             LIMIT 1`;
      params = [studentId, userId];
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
      `SELECT id, teacher_id FROM classes
       WHERE id = ?
         AND (teacher_id = ? OR EXISTS (
           SELECT 1 FROM class_subjects cs
           WHERE cs.class_id = classes.id AND cs.teacher_id = ?
         ))
       LIMIT 1`,
      [classId, req.user.id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    req.classId = classId;
    if (Number(rows[0].teacher_id) !== Number(req.user.id)) {
      const [assignments] = await db.execute(
        'SELECT subject_id FROM class_subjects WHERE class_id = ? AND teacher_id = ?',
        [classId, req.user.id]
      );
      req.teacherSubjectIds = assignments.map(row => Number(row.subject_id));
    } else {
      req.teacherSubjectIds = null;
    }
    return next();
  } catch (err) {
    console.error('Class access check failed:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};


const requireTeachingAssignment = async (req, res, next) => {
  const { student_id, class_id, subject_id } = req.body || {};
  const studentId = positiveId(student_id);
  const classId = positiveId(class_id);
  const subjectId = positiveId(subject_id);

  if (!studentId || !classId || !subjectId) {
    return res.status(400).json({
      success: false,
      message: 'Valid student_id, class_id and subject_id are required.'
    });
  }

  try {
    const [rows] = await db.execute(
      `SELECT s.id
       FROM students s
       WHERE s.id = ? AND s.class_id = ?
         AND EXISTS (SELECT 1 FROM subjects WHERE id = ?)
         AND (
           ? = 'admin'
           OR
           EXISTS (SELECT 1 FROM classes c WHERE c.id = s.class_id AND c.teacher_id = ?)
           OR EXISTS (
             SELECT 1 FROM class_subjects cs
             WHERE cs.class_id = s.class_id
               AND cs.subject_id = ?
               AND cs.teacher_id = ?
           )
         )
       LIMIT 1`,
      [studentId, classId, subjectId, req.user.role, req.user.id, subjectId, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Student or teaching assignment not found.' });
    }

    return next();
  } catch (err) {
    console.error('Teaching assignment check failed:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const requireBulkTeachingAssignment = async (req, res, next) => {
  const { class_id, subject_id, grades } = req.body || {};
  const classId = positiveId(class_id);
  const subjectId = positiveId(subject_id);

  if (!classId || !subjectId || !Array.isArray(grades) || grades.length === 0) {
    return res.status(400).json({ success: false, message: 'Valid class_id, subject_id and non-empty grades[] are required.' });
  }

  if (grades.length > 100 || grades.some(g => !positiveId(g.student_id))) {
    return res.status(400).json({ success: false, message: 'grades[] must contain at most 100 valid student IDs.' });
  }

  try {
    const [classes] = await db.execute(
      `SELECT id FROM classes
       WHERE id = ? AND EXISTS (SELECT 1 FROM subjects WHERE id = ?)
         AND (
         ? = 'admin'
         OR
         teacher_id = ?
         OR EXISTS (
           SELECT 1 FROM class_subjects cs
           WHERE cs.class_id = classes.id AND cs.subject_id = ? AND cs.teacher_id = ?
         )
       ) LIMIT 1`,
      [classId, subjectId, req.user.role, req.user.id, subjectId, req.user.id]
    );

    if (!classes.length) {
      return res.status(404).json({ success: false, message: 'Teaching assignment not found.' });
    }

    const ids = grades.map(g => positiveId(g.student_id));
    const placeholders = ids.map(() => '?').join(',');
    const [students] = await db.execute(
      `SELECT id FROM students WHERE class_id = ? AND id IN (${placeholders})`,
      [classId, ...ids]
    );

    if (students.length !== ids.length) {
      return res.status(400).json({ success: false, message: 'Every grade must belong to a student in the assigned class.' });
    }

    return next();
  } catch (err) {
    console.error('Bulk teaching assignment check failed:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};


const requireAttendanceAssignment = async (req, res, next) => {
  const { class_id, student_id, records } = req.body || {};
  const classId = positiveId(class_id);
  if (!classId) {
    return res.status(400).json({ success: false, message: 'A valid class_id is required.' });
  }

  const studentIds = Array.isArray(records)
    ? records.map(record => positiveId(record && record.student_id))
    : [positiveId(student_id)];

  if (!studentIds.length || studentIds.some(id => !id) || studentIds.length > 100) {
    return res.status(400).json({ success: false, message: 'Provide valid student IDs (maximum 100 records).' });
  }

  try {
    if (req.user.role !== 'admin') {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
      const [classes] = await db.execute(
        'SELECT id FROM classes WHERE id = ? AND teacher_id = ? LIMIT 1',
        [classId, req.user.id]
      );
      if (!classes.length) {
        return res.status(404).json({ success: false, message: 'Class not found.' });
      }
    }

    const placeholders = studentIds.map(() => '?').join(',');
    const [students] = await db.execute(
      `SELECT id FROM students WHERE class_id = ? AND id IN (${placeholders})`,
      [classId, ...studentIds]
    );

    if (students.length !== studentIds.length) {
      return res.status(400).json({ success: false, message: 'Every student must belong to the specified class.' });
    }

    return next();
  } catch (err) {
    console.error('Attendance assignment check failed:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};


const requireGradeStudentAccess = async (req, res, next) => {
  const studentId = positiveId(req.params.studentId);
  if (!studentId) {
    return res.status(400).json({ success: false, message: 'A valid student ID is required.' });
  }

  if (req.user.role === 'admin' || req.user.role === 'parent' || req.user.role === 'student') {
    return requireStudentAccess('studentId')(req, res, next);
  }

  if (req.user.role !== 'teacher') {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  try {
    const [students] = await db.execute(
      'SELECT s.id, s.class_id, c.teacher_id FROM students s LEFT JOIN classes c ON c.id = s.class_id WHERE s.id = ? LIMIT 1',
      [studentId]
    );
    if (!students.length) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    if (Number(students[0].teacher_id) === Number(req.user.id)) {
      req.teacherSubjectIds = null;
      req.studentId = studentId;
      return next();
    }

    const [assignments] = await db.execute(
      'SELECT subject_id FROM class_subjects WHERE class_id = ? AND teacher_id = ?',
      [students[0].class_id, req.user.id]
    );
    if (!assignments.length) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    req.teacherSubjectIds = assignments.map(row => Number(row.subject_id));
    req.studentId = studentId;
    return next();
  } catch (err) {
    console.error('Grade access check failed:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { requireStudentAccess, resolveOwnStudentId, requireClassAccess, requireTeachingAssignment, requireBulkTeachingAssignment, requireAttendanceAssignment, requireGradeStudentAccess };
