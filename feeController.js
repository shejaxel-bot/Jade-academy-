// controllers/feeController.js
const db = require('../config/db');

// ── GET /api/fees/types ─────────────────────────────────────────
// List all fee types (optionally filter by section/term/year)
exports.getFeeTypes = async (req, res) => {
  try {
    const { section, term, academic_year } = req.query;
    const conditions = [];
    const params = [];

    if (section)       { conditions.push('section IN (?, "all")');  params.push(section); }
    if (term)          { conditions.push('term = ?');                params.push(term); }
    if (academic_year) { conditions.push('academic_year = ?');       params.push(academic_year); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [rows] = await db.execute(
      `SELECT * FROM fee_types ${where} ORDER BY due_date`, params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── POST /api/fees/types ────────────────────────────────────────
// Admin creates a fee type
exports.createFeeType = async (req, res) => {
  try {
    const { name, amount, section, term, academic_year, due_date } = req.body;

    if (!name || !amount || !academic_year) {
      return res.status(400).json({ success: false, message: 'name, amount and academic_year are required.' });
    }

    const [result] = await db.execute(
      `INSERT INTO fee_types (name, amount, section, term, academic_year, due_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, amount, section || 'all', term || null, academic_year, due_date || null]
    );

    res.status(201).json({ success: true, message: 'Fee type created.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/fees/student/:studentId ───────────────────────────
// Get a student's full fee statement (what is owed vs paid)
exports.getStudentFeeStatement = async (req, res) => {
  try {
    const { academic_year } = req.query;

    // Get student's section for filtering fee types
    const [studentRows] = await db.execute(
      `SELECT s.id, u.full_name, c.section, c.academic_year AS current_year
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.id = ?`,
      [req.params.studentId]
    );

    if (!studentRows.length) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const student = studentRows[0];
    const year    = academic_year || student.current_year;

    // Fee types applicable to this student
    const [feeTypes] = await db.execute(
      `SELECT ft.*,
              COALESCE(SUM(fp.amount_paid), 0) AS amount_paid,
              (ft.amount - COALESCE(SUM(fp.amount_paid), 0)) AS balance
       FROM fee_types ft
       LEFT JOIN fee_payments fp ON fp.fee_type_id = ft.id AND fp.student_id = ?
       WHERE ft.academic_year = ?
         AND (ft.section = ? OR ft.section = 'all')
       GROUP BY ft.id
       ORDER BY ft.due_date`,
      [req.params.studentId, year, student.section || 'primary']
    );

    const totalCharged = feeTypes.reduce((s, f) => s + parseFloat(f.amount), 0);
    const totalPaid    = feeTypes.reduce((s, f) => s + parseFloat(f.amount_paid), 0);
    const totalBalance = feeTypes.reduce((s, f) => s + parseFloat(f.balance), 0);

    // Payment history
    const [payments] = await db.execute(
      `SELECT fp.*, ft.name AS fee_name, u.full_name AS received_by_name
       FROM fee_payments fp
       JOIN fee_types ft ON fp.fee_type_id = ft.id
       LEFT JOIN users u ON fp.received_by = u.id
       WHERE fp.student_id = ?
       ORDER BY fp.payment_date DESC`,
      [req.params.studentId]
    );

    res.json({
      success: true,
      statement: {
        student,
        academic_year: year,
        fee_types:     feeTypes,
        payments,
        summary: {
          total_charged: totalCharged.toFixed(2),
          total_paid:    totalPaid.toFixed(2),
          total_balance: totalBalance.toFixed(2),
          status: totalBalance <= 0 ? 'FULLY PAID' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID',
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── POST /api/fees/payments ─────────────────────────────────────
// Admin/accountant records a fee payment
exports.recordPayment = async (req, res) => {
  try {
    const { student_id, fee_type_id, amount_paid, payment_method, reference_no, payment_date, notes } = req.body;

    if (!student_id || !fee_type_id || !amount_paid) {
      return res.status(400).json({ success: false, message: 'student_id, fee_type_id and amount_paid are required.' });
    }

    // Check the fee type exists and get the amount
    const [feeRows] = await db.execute('SELECT * FROM fee_types WHERE id = ?', [fee_type_id]);
    if (!feeRows.length) {
      return res.status(404).json({ success: false, message: 'Fee type not found.' });
    }

    // Check how much has already been paid
    const [[{ already_paid }]] = await db.execute(
      'SELECT COALESCE(SUM(amount_paid), 0) AS already_paid FROM fee_payments WHERE student_id = ? AND fee_type_id = ?',
      [student_id, fee_type_id]
    );

    const fee       = feeRows[0];
    const remaining = fee.amount - already_paid;

    if (amount_paid > remaining) {
      return res.status(400).json({
        success: false,
        message: `Overpayment detected. Remaining balance is ${remaining}. Amount paid cannot exceed this.`
      });
    }

    const [result] = await db.execute(
      `INSERT INTO fee_payments
         (student_id, fee_type_id, amount_paid, payment_method, reference_no, payment_date, received_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [student_id, fee_type_id, amount_paid,
       payment_method || 'cash', reference_no || null,
       payment_date || new Date().toISOString().split('T')[0],
       req.user.id, notes || null]
    );

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully.',
      payment_id: result.insertId,
      new_balance: (remaining - amount_paid).toFixed(2),
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Reference number already exists.' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/fees/summary ───────────────────────────────────────
// Admin dashboard: overall fee collection summary
exports.getFeeSummary = async (req, res) => {
  try {
    const { academic_year } = req.query;

    const [[totals]] = await db.execute(
      `SELECT
         COUNT(DISTINCT fp.student_id)            AS students_paid,
         SUM(fp.amount_paid)                      AS total_collected,
         COUNT(fp.id)                             AS total_transactions
       FROM fee_payments fp
       JOIN fee_types ft ON fp.fee_type_id = ft.id
       WHERE ft.academic_year = ?`,
      [academic_year || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)]
    );

    // Collection by payment method
    const [byMethod] = await db.execute(
      `SELECT fp.payment_method, SUM(fp.amount_paid) AS total
       FROM fee_payments fp
       JOIN fee_types ft ON fp.fee_type_id = ft.id
       WHERE ft.academic_year = ?
       GROUP BY fp.payment_method`,
      [academic_year || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)]
    );

    // Monthly collection trend
    const [monthly] = await db.execute(
      `SELECT DATE_FORMAT(fp.payment_date, '%Y-%m') AS month,
              SUM(fp.amount_paid) AS total
       FROM fee_payments fp
       JOIN fee_types ft ON fp.fee_type_id = ft.id
       WHERE ft.academic_year = ?
       GROUP BY month ORDER BY month`,
      [academic_year || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)]
    );

    res.json({ success: true, data: { totals, by_method: byMethod, monthly_trend: monthly } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── DELETE /api/fees/payments/:id ──────────────────────────────
// Admin reverses/deletes a payment (with care!)
exports.reversePayment = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM fee_payments WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Payment not found.' });

    await db.execute('DELETE FROM fee_payments WHERE id = ?', [req.params.id]);

    res.json({ success: true, message: 'Payment reversed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
