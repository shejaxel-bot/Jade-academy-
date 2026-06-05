// routes/index.js
const express = require('express');
const router  = express.Router();

const { protect, authorize } = require('../middleware/auth');

const authCtrl       = require('../controllers/authController');
const studentCtrl    = require('../controllers/studentController');
const gradeCtrl      = require('../controllers/gradeController');
const feeCtrl        = require('../controllers/feeController');
const attendanceCtrl = require('../controllers/attendanceController');

// ══════════════════════════════════════════════════
//  AUTH ROUTES  /api/auth
// ══════════════════════════════════════════════════
router.post('/auth/login',           authCtrl.login);
router.post('/auth/register',        protect, authorize('admin'), authCtrl.register);
router.get( '/auth/me',              protect, authCtrl.getMe);
router.put( '/auth/change-password', protect, authCtrl.changePassword);

// ══════════════════════════════════════════════════
//  STUDENT ROUTES  /api/students
// ══════════════════════════════════════════════════

// My own profile (student logs in and views their info)
router.get('/students/me',
  protect, authorize('student'),
  studentCtrl.getMyProfile
);

// Student's own attendance
router.get('/students/me/attendance',
  protect, authorize('student'),
  (req, res, next) => { req.params.id = req.user.id; next(); },
  studentCtrl.getAttendance
);

// Admin & teacher: list all students
router.get('/students',
  protect, authorize('admin', 'teacher'),
  studentCtrl.getAllStudents
);

// Admin & teacher: get a specific student
router.get('/students/:id',
  protect, authorize('admin', 'teacher', 'parent'),
  studentCtrl.getStudent
);

// Admin & teacher: update student info
router.put('/students/:id',
  protect, authorize('admin', 'teacher'),
  studentCtrl.updateStudent
);

// Get attendance for a specific student
router.get('/students/:id/attendance',
  protect, authorize('admin', 'teacher', 'parent'),
  studentCtrl.getAttendance
);

// ══════════════════════════════════════════════════
//  GRADES ROUTES  /api/grades
// ══════════════════════════════════════════════════

// Teacher records one grade
router.post('/grades',
  protect, authorize('teacher', 'admin'),
  gradeCtrl.recordGrade
);

// Teacher records grades for entire class
router.post('/grades/bulk',
  protect, authorize('teacher', 'admin'),
  gradeCtrl.recordBulkGrades
);

// Student views their own grades
router.get('/grades/me',
  protect, authorize('student'),
  (req, res, next) => {
    // resolve student_id from user_id
    req.params.studentId = req.user.id;  // controller will resolve
    next();
  },
  gradeCtrl.getStudentGrades
);

// Parent / teacher / admin views a student's grades
router.get('/grades/student/:studentId',
  protect, authorize('admin', 'teacher', 'parent'),
  gradeCtrl.getStudentGrades
);

// Teacher / admin views all grades for a class
router.get('/grades/class/:classId',
  protect, authorize('admin', 'teacher'),
  gradeCtrl.getClassGrades
);

// Report card
router.get('/grades/report-card/:studentId',
  protect, authorize('admin', 'teacher', 'parent', 'student'),
  gradeCtrl.getReportCard
);

// ══════════════════════════════════════════════════
//  FEE ROUTES  /api/fees
// ══════════════════════════════════════════════════

// Fee types
router.get( '/fees/types',  protect, feeCtrl.getFeeTypes);
router.post('/fees/types',  protect, authorize('admin'), feeCtrl.createFeeType);

// Fee summary dashboard (admin only)
router.get('/fees/summary', protect, authorize('admin'), feeCtrl.getFeeSummary);

// Student fee statement (own)
router.get('/fees/me',
  protect, authorize('student'),
  (req, res, next) => { req.params.studentId = req.user.id; next(); },
  feeCtrl.getStudentFeeStatement
);

// Admin/parent views a student's fee statement
router.get('/fees/student/:studentId',
  protect, authorize('admin', 'parent'),
  feeCtrl.getStudentFeeStatement
);

// Record a payment
router.post('/fees/payments',
  protect, authorize('admin'),
  feeCtrl.recordPayment
);

// Reverse a payment
router.delete('/fees/payments/:id',
  protect, authorize('admin'),
  feeCtrl.reversePayment
);

// ══════════════════════════════════════════════════
//  ATTENDANCE ROUTES  /api/attendance
// ══════════════════════════════════════════════════

// Mark single student attendance
router.post('/attendance',
  protect, authorize('teacher', 'admin'),
  attendanceCtrl.markAttendance
);

// Mark entire class attendance at once
router.post('/attendance/bulk',
  protect, authorize('teacher', 'admin'),
  attendanceCtrl.markBulkAttendance
);

// View class attendance for a date
router.get('/attendance/class/:classId',
  protect, authorize('teacher', 'admin'),
  attendanceCtrl.getClassAttendance
);

// View a student's attendance summary
router.get('/attendance/student/:studentId/summary',
  protect, authorize('admin', 'teacher', 'parent'),
  attendanceCtrl.getStudentAttendanceSummary
);

module.exports = router;
