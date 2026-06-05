-- ================================================================
--  SCHOOL MANAGEMENT SYSTEM - MySQL Database Schema
--  Run this file in MySQL Workbench or via: mysql -u root -p < database.sql
-- ================================================================

CREATE DATABASE IF NOT EXISTS school_db;
USE school_db;

-- ── USERS (shared auth table for all roles) ──────────────────────
CREATE TABLE users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_code   VARCHAR(30)  NOT NULL UNIQUE,   -- e.g. STU-2026-001
  full_name   VARCHAR(100) NOT NULL,
  email       VARCHAR(100) UNIQUE,
  phone       VARCHAR(20),
  password    VARCHAR(255) NOT NULL,
  role        ENUM('student','parent','teacher','admin') NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── CLASSES ──────────────────────────────────────────────────────
CREATE TABLE classes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(50) NOT NULL,            -- e.g. "Stage 7A"
  section     ENUM('nursery','primary','secondary','cambridge') NOT NULL,
  teacher_id  INT,                             -- class teacher
  academic_year VARCHAR(10) NOT NULL,          -- e.g. "2025-2026"
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ── STUDENTS ─────────────────────────────────────────────────────
CREATE TABLE students (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL UNIQUE,
  reg_number    VARCHAR(30) NOT NULL UNIQUE,   -- e.g. STU-2026-001
  class_id      INT,
  parent_id     INT,                           -- linked parent user
  date_of_birth DATE,
  gender        ENUM('male','female','other'),
  address       TEXT,
  admission_date DATE DEFAULT (CURRENT_DATE),
  status        ENUM('active','graduated','transferred','suspended') DEFAULT 'active',
  FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id)  REFERENCES classes(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ── SUBJECTS ─────────────────────────────────────────────────────
CREATE TABLE subjects (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  code        VARCHAR(20)  NOT NULL UNIQUE,    -- e.g. "MATH101"
  section     ENUM('nursery','primary','secondary','cambridge'),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── CLASS SUBJECTS (which subjects belong to which class) ────────
CREATE TABLE class_subjects (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  class_id    INT NOT NULL,
  subject_id  INT NOT NULL,
  teacher_id  INT,
  UNIQUE(class_id, subject_id),
  FOREIGN KEY (class_id)   REFERENCES classes(id)  ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id)    ON DELETE SET NULL
);

-- ── GRADES / RESULTS ─────────────────────────────────────────────
CREATE TABLE grades (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  student_id   INT NOT NULL,
  subject_id   INT NOT NULL,
  class_id     INT NOT NULL,
  term         ENUM('term1','term2','term3') NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  cat_score    DECIMAL(5,2) DEFAULT 0,         -- Continuous Assessment (40%)
  exam_score   DECIMAL(5,2) DEFAULT 0,         -- Final Exam (60%)
  total_score  DECIMAL(5,2) GENERATED ALWAYS AS
               (ROUND((cat_score * 0.4) + (exam_score * 0.6), 2)) STORED,
  grade_letter VARCHAR(2)   GENERATED ALWAYS AS (
    CASE
      WHEN ROUND((cat_score * 0.4) + (exam_score * 0.6), 2) >= 80 THEN 'A'
      WHEN ROUND((cat_score * 0.4) + (exam_score * 0.6), 2) >= 70 THEN 'B'
      WHEN ROUND((cat_score * 0.4) + (exam_score * 0.6), 2) >= 60 THEN 'C'
      WHEN ROUND((cat_score * 0.4) + (exam_score * 0.6), 2) >= 50 THEN 'D'
      ELSE 'F'
    END
  ) STORED,
  remarks      TEXT,
  recorded_by  INT,
  recorded_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, subject_id, term, academic_year),
  FOREIGN KEY (student_id)  REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id)  REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id)    REFERENCES classes(id)  ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id)    ON DELETE SET NULL
);

-- ── ATTENDANCE ───────────────────────────────────────────────────
CREATE TABLE attendance (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT NOT NULL,
  class_id    INT NOT NULL,
  date        DATE NOT NULL,
  status      ENUM('present','absent','late','excused') DEFAULT 'present',
  notes       TEXT,
  marked_by   INT,
  UNIQUE(student_id, date),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id)   REFERENCES classes(id)  ON DELETE CASCADE,
  FOREIGN KEY (marked_by)  REFERENCES users(id)    ON DELETE SET NULL
);

-- ── FEES ─────────────────────────────────────────────────────────
CREATE TABLE fee_types (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,           -- e.g. "Tuition Fee Term 1"
  amount      DECIMAL(10,2) NOT NULL,
  section     ENUM('nursery','primary','secondary','cambridge','all') DEFAULT 'all',
  term        ENUM('term1','term2','term3','annual'),
  academic_year VARCHAR(10) NOT NULL,
  due_date    DATE,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fee_payments (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  student_id      INT NOT NULL,
  fee_type_id     INT NOT NULL,
  amount_paid     DECIMAL(10,2) NOT NULL,
  payment_method  ENUM('cash','bank_transfer','mobile_money','card') DEFAULT 'cash',
  reference_no    VARCHAR(50) UNIQUE,          -- bank/MoMo ref
  payment_date    DATE DEFAULT (CURRENT_DATE),
  received_by     INT,
  notes           TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id)   REFERENCES students(id)   ON DELETE CASCADE,
  FOREIGN KEY (fee_type_id)  REFERENCES fee_types(id)  ON DELETE CASCADE,
  FOREIGN KEY (received_by)  REFERENCES users(id)       ON DELETE SET NULL
);

-- ── EVENTS ───────────────────────────────────────────────────────
CREATE TABLE events (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  event_date  DATE NOT NULL,
  start_time  TIME,
  end_time    TIME,
  location    VARCHAR(200),
  created_by  INT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ── SAMPLE DATA ──────────────────────────────────────────────────
-- Default admin user  (password: Admin@123)
INSERT INTO users (user_code, full_name, email, phone, password, role) VALUES
('ADMIN-001', 'System Administrator', 'admin@excelacademy.rw', '+250788000001',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LzTfAkq2Zx2', 'admin');

-- Sample classes
INSERT INTO classes (name, section, academic_year) VALUES
('Nursery 1',  'nursery',   '2025-2026'),
('Stage 1A',   'primary',   '2025-2026'),
('Stage 7A',   'secondary', '2025-2026'),
('Cambridge AS','cambridge', '2025-2026');

-- Sample subjects
INSERT INTO subjects (name, code, section) VALUES
('Mathematics',  'MATH101', 'primary'),
('English',      'ENG101',  'primary'),
('Science',      'SCI101',  'primary'),
('Mathematics',  'MATH201', 'secondary'),
('English',      'ENG201',  'secondary'),
('Physics',      'PHY201',  'secondary'),
('Chemistry',    'CHEM201', 'secondary'),
('Biology',      'BIO201',  'secondary');

-- Sample fee types
INSERT INTO fee_types (name, amount, section, term, academic_year, due_date) VALUES
('Tuition Fee - Term 1', 150000, 'primary',   'term1', '2025-2026', '2025-09-30'),
('Tuition Fee - Term 1', 200000, 'secondary', 'term1', '2025-2026', '2025-09-30'),
('Activity Fee',          20000, 'all',       'term1', '2025-2026', '2025-09-30'),
('Tuition Fee - Term 2', 150000, 'primary',   'term2', '2025-2026', '2026-01-15'),
('Tuition Fee - Term 2', 200000, 'secondary', 'term2', '2025-2026', '2026-01-15');
