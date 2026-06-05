// controllers/gradeController.js
const db = require('../config/db');

// ── POST /api/grades ────────────────────────────────────────────
// Teacher records grades for a student
exports.recordGrade = async (req, res) => {
  try {
    const { student_id, subject_id, class_id, term, academic_year, cat_score, exam_score, remarks } = req.body;

    if (!student_id || !subject_id || !class_id || !term || !academic_year) {
      return res.status(400).json({ success: false, message: 'student_id, subject_id, class_id, term and academic_year are required.' });
    }

    // Validate scores
    if (cat_score < 0 || cat_score > 100 || exam_score < 0 || exam_score > 100) {
      return res.status(400).json({ success: false, message: 'Scores must be between 0 and 100.' });
    }

    await db.execute(
      `INSERT INTO grades (student_id, subject_id, class_id, term, academic_year, cat_score, exam_score, remarks, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         cat_score   = VALUES(cat_score),
         exam_score  = VALUES(exam_score),
         remarks     = VALUES(remarks),
         recorded_by = VALUES(recorded_by)`,
      [student_id, subject_id, class_id, term, academic_year,
       cat_score || 0, exam_score || 0, remarks || null, req.user.id]
    );

    res.status(201).json({ success: true, message: 'Grade recorded successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── POST /api/grades/bulk ───────────────────────────────────────
// Teacher records grades for an entire class at once
exports.recordBulkGrades = async (req, res) => {
  try {
    const { subject_id, class_id, term, academic_year, grades } = req.body;
    // grades = [{ student_id, cat_score, exam_score, remarks }]

    if (!grades || !Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({ success: false, message: 'grades array is required.' });
    }

    const values = grades.map(g => [
      g.student_id, subject_id, class_id, term,
      academic_year, g.cat_score || 0, g.exam_score || 0,
      g.remarks || null, req.user.id
    ]);

    // Use a transaction for bulk insert
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      for (const v of values) {
        await conn.execute(
          `INSERT INTO grades (student_id, subject_id, class_id, term, academic_year, cat_score, exam_score, remarks, recorded_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             cat_score   = VALUES(cat_score),
             exam_score  = VALUES(exam_score),
             remarks     = VALUES(remarks),
             recorded_by = VALUES(recorded_by)`,
          v
        );
      }
      await conn.commit();
      res.json({ success: true, message: `${grades.length} grade(s) recorded successfully.` });
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

// ── GET /api/grades/student/:studentId ─────────────────────────
// Get all grades for a student (student, parent, teacher, admin)
exports.getStudentGrades = async (req, res) => {
  try {
    const { term, academic_year } = req.query;
    const params = [req.params.studentId];
    const conditions = ['g.student_id = ?'];

    if (term)          { conditions.push('g.term = ?');           params.push(term); }
    if (academic_year) { conditions.push('g.academic_year = ?');  params.push(academic_year); }

    const [grades] = await db.execute(
      `SELECT g.id, sub.name AS subject, sub.code,
              g.term, g.academic_year,
              g.cat_score, g.exam_score, g.total_score, g.grade_letter,
              g.remarks, g.recorded_at,
              u.full_name AS recorded_by
       FROM grades g
       JOIN subjects sub ON g.subject_id = sub.id
       LEFT JOIN users u ON g.recorded_by = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY g.academic_year DESC, g.term, sub.name`,
      params
    );

    // Group by term for easier frontend rendering
    const grouped = grades.reduce((acc, g) => {
      const key = `${g.academic_year} - ${g.term}`;
      if (!acc[key]) acc[key] = { term: g.term, academic_year: g.academic_year, subjects: [], average: 0 };
      acc[key].subjects.push(g);
      return acc;
    }, {});

    // Calculate average per term group
    Object.values(grouped).forEach(group => {
      const total = group.subjects.reduce((s, g) => s + parseFloat(g.total_score || 0), 0);
      group.average = group.subjects.length ? (total / group.subjects.length).toFixed(2) : 0;
      group.overall_grade = group.average >= 80 ? 'A' : group.average >= 70 ? 'B' :
                            group.average >= 60 ? 'C' : group.average >= 50 ? 'D' : 'F';
    });

    res.json({ success: true, data: grouped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/grades/class/:classId ─────────────────────────────
// Get all grades for a class (teacher/admin)
exports.getClassGrades = async (req, res) => {
  try {
    const { subject_id, term, academic_year } = req.query;

    if (!term || !academic_year) {
      return res.status(400).json({ success: false, message: 'term and academic_year are required.' });
    }

    const params = [req.params.classId, term, academic_year];
    let subjectFilter = '';
    if (subject_id) { subjectFilter = 'AND g.subject_id = ?'; params.push(subject_id); }

    const [rows] = await db.execute(
      `SELECT s.id AS student_id, s.reg_number,
              u.full_name AS student_name,
              sub.name AS subject, sub.code,
              g.cat_score, g.exam_score, g.total_score, g.grade_letter, g.remarks
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN grades g   ON g.student_id = s.id AND g.term = ? AND g.academic_year = ? ${subjectFilter}
       LEFT JOIN subjects sub ON g.subject_id = sub.id
       WHERE s.class_id = ?
       ORDER BY u.full_name, sub.name`,
      [term, academic_year, ...( subject_id ? [subject_id] : []), req.params.classId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/grades/report-card/:studentId ──────────────────────
// Full report card for a student per term
exports.getReportCard = async (req, res) => {
  try {
    const { term, academic_year } = req.query;

    if (!term || !academic_year) {
      return res.status(400).json({ success: false, message: 'term and academic_year are required.' });
    }

    // Student info
    const [studentRows] = await db.execute(
      `SELECT s.reg_number, u.full_name, c.name AS class_name,
              c.section, s.gender
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.id = ?`,
      [req.params.studentId]
    );

    if (!studentRows.length) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Grades
    const [grades] = await db.execute(
      `SELECT sub.name AS subject, sub.code,
              g.cat_score, g.exam_score, g.total_score, g.grade_letter, g.remarks
       FROM grades g
       JOIN subjects sub ON g.subject_id = sub.id
       WHERE g.student_id = ? AND g.term = ? AND g.academic_year = ?
       ORDER BY sub.name`,
      [req.params.studentId, term, academic_year]
    );

    // Class ranking
    const [ranking] = await db.execute(
      `SELECT student_id,
              RANK() OVER (ORDER BY AVG(total_score) DESC) AS class_rank,
              AVG(total_score) AS avg_score
       FROM grades
       WHERE class_id = (SELECT class_id FROM students WHERE id = ?)
         AND term = ? AND academic_year = ?
       GROUP BY student_id`,
      [req.params.studentId, term, academic_year]
    );

    const myRank = ranking.find(r => r.student_id == req.params.studentId);
    const totalMarks  = grades.reduce((s, g) => s + parseFloat(g.total_score || 0), 0);
    const average     = grades.length ? (totalMarks / grades.length).toFixed(2) : 0;
    const overallGrade = average >= 80 ? 'A' : average >= 70 ? 'B' :
                         average >= 60 ? 'C' : average >= 50 ? 'D' : 'F';

    res.json({
      success: true,
      report_card: {
        student:       studentRows[0],
        term,
        academic_year,
        subjects:      grades,
        summary: {
          total_subjects: grades.length,
          total_marks:    totalMarks.toFixed(2),
          average,
          overall_grade:  overallGrade,
          class_rank:     myRank?.class_rank || 'N/A',
          class_size:     ranking.length,
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
