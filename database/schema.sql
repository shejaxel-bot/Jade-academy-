-- Jaxe Academy Database Schema
-- This schema supports the complete website functionality

-- ==================== CORE TABLES ====================

-- Users/Accounts
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('student', 'parent', 'teacher', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Students
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    admission_number VARCHAR(50) UNIQUE,
    date_of_birth DATE,
    gender ENUM('Male', 'Female', 'Other'),
    section ENUM('Nursery', 'Primary', 'Secondary', 'Cambridge') NOT NULL,
    stage VARCHAR(20),
    enrollment_date DATE,
    status ENUM('Active', 'Inactive', 'Graduated') DEFAULT 'Active',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Parents/Guardians
CREATE TABLE parents (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    relationship VARCHAR(50),
    occupation VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Student-Parent Relationships
CREATE TABLE student_parent (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    student_id INTEGER NOT NULL,
    parent_id INTEGER NOT NULL,
    relationship VARCHAR(50),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    UNIQUE KEY unique_relationship (student_id, parent_id)
);

-- Teachers/Staff
CREATE TABLE teachers (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    qualification VARCHAR(255),
    specialization VARCHAR(100),
    department VARCHAR(100),
    hire_date DATE,
    status ENUM('Active', 'Inactive', 'On Leave') DEFAULT 'Active',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== ACADEMIC STRUCTURE ====================

-- Courses/Subjects
CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    course_name VARCHAR(255) NOT NULL,
    course_code VARCHAR(50) UNIQUE,
    description TEXT,
    section ENUM('Nursery', 'Primary', 'Secondary', 'Cambridge') NOT NULL,
    stage VARCHAR(20),
    teacher_id INTEGER,
    credits INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- Classes/Streams
CREATE TABLE classes (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    class_name VARCHAR(100) NOT NULL,
    section ENUM('Nursery', 'Primary', 'Secondary', 'Cambridge') NOT NULL,
    stage VARCHAR(20),
    form VARCHAR(20),
    class_teacher_id INTEGER,
    capacity INT,
    academic_year VARCHAR(9),
    FOREIGN KEY (class_teacher_id) REFERENCES teachers(id),
    UNIQUE KEY unique_class (class_name, academic_year)
);

-- Class Enrollment
CREATE TABLE class_enrollment (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    student_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    academic_year VARCHAR(9),
    enrollment_date DATE,
    status ENUM('Active', 'Dropped', 'Transferred') DEFAULT 'Active',
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (student_id, class_id, academic_year)
);

-- Course Enrollment
CREATE TABLE course_enrollment (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    academic_year VARCHAR(9),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- ==================== GRADES & ASSESSMENTS ====================

-- Grades
CREATE TABLE grades (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    assessment_type ENUM('Continuous Assessment', 'Midterm', 'Final Exam', 'Assignment', 'Project') NOT NULL,
    marks DECIMAL(5,2),
    total_marks DECIMAL(5,2),
    percentage DECIMAL(5,2),
    grade VARCHAR(2),
    recorded_date DATE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Attendance
CREATE TABLE attendance (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    student_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('Present', 'Absent', 'Late', 'Excused') NOT NULL,
    notes TEXT,
    recorded_by INTEGER,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES teachers(id),
    UNIQUE KEY unique_attendance (student_id, class_id, attendance_date)
);

-- ==================== FINANCIAL ====================

-- Fee Structure
CREATE TABLE fee_structure (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    academic_year VARCHAR(9) NOT NULL,
    section ENUM('Nursery', 'Primary', 'Secondary', 'Cambridge') NOT NULL,
    stage VARCHAR(20),
    tuition_fee DECIMAL(10,2),
    development_fee DECIMAL(10,2),
    activity_fee DECIMAL(10,2),
    total_fee DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Fees
CREATE TABLE student_fees (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    student_id INTEGER NOT NULL,
    academic_year VARCHAR(9) NOT NULL,
    total_amount DECIMAL(10,2),
    amount_paid DECIMAL(10,2) DEFAULT 0,
    balance DECIMAL(10,2),
    due_date DATE,
    status ENUM('Paid', 'Partial', 'Pending', 'Overdue') DEFAULT 'Pending',
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Payment Records
CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    fee_id INTEGER NOT NULL,
    amount DECIMAL(10,2),
    payment_date DATE,
    payment_method ENUM('Bank Transfer', 'Cash', 'Cheque', 'Online', 'Mobile Money'),
    receipt_number VARCHAR(50) UNIQUE,
    notes TEXT,
    recorded_by INTEGER,
    FOREIGN KEY (fee_id) REFERENCES student_fees(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES teachers(id)
);

-- ==================== CALENDAR & EVENTS ====================

-- Academic Calendar
CREATE TABLE academic_calendar (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    academic_year VARCHAR(9) NOT NULL,
    term INT,
    term_name VARCHAR(50),
    start_date DATE,
    end_date DATE,
    break_start_date DATE,
    break_end_date DATE
);

-- Events
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    event_name VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE,
    event_time TIME,
    location VARCHAR(255),
    event_type ENUM('Academic', 'Sports', 'Cultural', 'Admin', 'Holiday', 'Other'),
    organizer_id INTEGER,
    status ENUM('Scheduled', 'Ongoing', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES teachers(id)
);

-- ==================== COMMUNICATIONS ====================

-- Messages
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    sender_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    subject VARCHAR(255),
    message TEXT,
    attachment_url VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id)
);

-- Announcements
CREATE TABLE announcements (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    target_audience ENUM('All', 'Students', 'Parents', 'Teachers', 'Specific Class'),
    target_class_id INTEGER,
    published_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATE,
    FOREIGN KEY (target_class_id) REFERENCES classes(id),
    FOREIGN KEY (published_by) REFERENCES teachers(id)
);

-- ==================== LEARNING RESOURCES ====================

-- Learning Materials
CREATE TABLE learning_materials (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(255),
    course_id INTEGER,
    material_type ENUM('PDF', 'Video', 'Audio', 'Document', 'Image', 'Other'),
    uploaded_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES teachers(id)
);

-- Assignments
CREATE TABLE assignments (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    course_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    assigned_by INTEGER NOT NULL,
    due_date DATE,
    total_marks DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (assigned_by) REFERENCES teachers(id)
);

-- Assignment Submissions
CREATE TABLE assignment_submissions (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    assignment_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    submission_file_url VARCHAR(255),
    submitted_date DATETIME,
    marks_obtained DECIMAL(5,2),
    feedback TEXT,
    graded_by INTEGER,
    graded_date DATETIME,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (graded_by) REFERENCES teachers(id)
);

-- ==================== TESTIMONIALS & REVIEWS ====================

-- Testimonials
CREATE TABLE testimonials (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    message TEXT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    image_url VARCHAR(255),
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending'
);

-- ==================== APPLICATIONS ====================

-- Admissions Applications
CREATE TABLE applications (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    application_number VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('Male', 'Female', 'Other'),
    section ENUM('Nursery', 'Primary', 'Secondary', 'Cambridge') NOT NULL,
    stage VARCHAR(20),
    parent_first_name VARCHAR(100) NOT NULL,
    parent_last_name VARCHAR(100) NOT NULL,
    parent_email VARCHAR(255),
    parent_phone VARCHAR(20),
    parent_occupation VARCHAR(100),
    application_date DATE,
    status ENUM('Submitted', 'Under Review', 'Accepted', 'Rejected', 'Withdrawn') DEFAULT 'Submitted',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==================== BLOG/NEWS ====================

-- Blog Posts
CREATE TABLE blog_posts (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    content LONGTEXT,
    featured_image_url VARCHAR(255),
    author_id INTEGER,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_date DATE,
    is_published BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (author_id) REFERENCES teachers(id)
);

-- ==================== CAMPUS INFORMATION ====================

-- Campuses
CREATE TABLE campuses (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    campus_name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    principal_name VARCHAR(255),
    founded_year INT,
    description TEXT
);

-- ==================== SETTINGS ====================

-- System Settings
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value) VALUES
('school_name', 'Jaxe Academy'),
('school_phone', '(+250) 789-407-385'),
('school_email', 'info@excelacademy.rw'),
('staff_email', 'staff@excelacademy.rw'),
('current_academic_year', '2025-2026'),
('timezone', 'Africa/Kigali');

-- ==================== AUDIT LOG ====================

-- Audit Log for tracking changes
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER,
    action VARCHAR(100),
    entity_type VARCHAR(100),
    entity_id INTEGER,
    old_value TEXT,
    new_value TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ==================== INDEXES ====================

-- Create indexes for performance optimization
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_student_admission ON students(admission_number);
CREATE INDEX idx_student_user ON students(user_id);
CREATE INDEX idx_parent_user ON parents(user_id);
CREATE INDEX idx_teacher_user ON teachers(user_id);
CREATE INDEX idx_course_section ON courses(section);
CREATE INDEX idx_class_academic_year ON classes(academic_year);
CREATE INDEX idx_enrollment_student ON class_enrollment(student_id);
CREATE INDEX idx_enrollment_class ON class_enrollment(class_id);
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_course ON grades(course_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_fees_student ON student_fees(student_id);
CREATE INDEX idx_fees_year ON student_fees(academic_year);
CREATE INDEX idx_payment_date ON payments(payment_date);
CREATE INDEX idx_event_date ON events(event_date);
CREATE INDEX idx_message_recipient ON messages(recipient_id);
CREATE INDEX idx_announcement_audience ON announcements(target_audience);
CREATE INDEX idx_application_status ON applications(status);
CREATE INDEX idx_blog_published ON blog_posts(is_published);
