# 🏫 School Management System – Backend API
> Node.js + Express + MySQL

---

## 📁 Project Structure

```
school-backend/
├── server.js                  ← Entry point
├── package.json
├── .env.example               ← Copy to .env and fill in values
├── database.sql               ← Run this first to set up MySQL
├── config/
│   └── db.js                  ← MySQL connection pool
├── middleware/
│   └── auth.js                ← JWT protect + role authorize
├── controllers/
│   ├── authController.js      ← Login, register, profile
│   ├── studentController.js   ← Student CRUD + attendance
│   ├── gradeController.js     ← Grades, report cards, ranking
│   ├── feeController.js       ← Fee types, payments, statements
│   └── attendanceController.js← Mark & view attendance
└── routes/
    └── index.js               ← All API routes
```

---

## ⚙️ Setup in Visual Studio / VS Code

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
# Copy the example file
copy .env.example .env        # Windows
cp .env.example .env          # Mac/Linux

# Then edit .env with your MySQL credentials
```

### 3. Set up the database
Open **MySQL Workbench** (or MySQL shell) and run:
```sql
source path/to/database.sql
```
Or via terminal:
```bash
mysql -u root -p < database.sql
```

### 4. Start the server
```bash
# Development (auto-restarts on file change)
npm run dev

# Production
npm start
```

Server runs at: **http://localhost:5000**

---

## 🔑 API Reference

### AUTH

| Method | Endpoint                   | Access | Description         |
|--------|----------------------------|--------|---------------------|
| POST   | /api/auth/login            | Public | Login any user      |
| POST   | /api/auth/register         | Admin  | Create a new user   |
| GET    | /api/auth/me               | Any    | Get own profile     |
| PUT    | /api/auth/change-password  | Any    | Change password     |

**Login example:**
```json
POST /api/auth/login
{
  "user_code": "STU-2026-001",
  "password": "yourpassword"
}
```
Returns a **JWT token** — include it in all other requests:
```
Authorization: Bearer <token>
```

---

### STUDENTS

| Method | Endpoint                         | Access            |
|--------|----------------------------------|-------------------|
| GET    | /api/students                    | Admin, Teacher    |
| GET    | /api/students/me                 | Student (own)     |
| GET    | /api/students/:id                | Admin, Teacher    |
| PUT    | /api/students/:id                | Admin, Teacher    |
| GET    | /api/students/:id/attendance     | Admin, Teacher, Parent |

---

### GRADES

| Method | Endpoint                             | Access               |
|--------|--------------------------------------|----------------------|
| POST   | /api/grades                          | Teacher, Admin       |
| POST   | /api/grades/bulk                     | Teacher, Admin       |
| GET    | /api/grades/me                       | Student (own grades) |
| GET    | /api/grades/student/:studentId       | Admin, Teacher, Parent |
| GET    | /api/grades/class/:classId           | Admin, Teacher       |
| GET    | /api/grades/report-card/:studentId   | All roles            |

**Record a grade:**
```json
POST /api/grades
{
  "student_id": 1,
  "subject_id": 2,
  "class_id": 3,
  "term": "term1",
  "academic_year": "2025-2026",
  "cat_score": 35,
  "exam_score": 58,
  "remarks": "Good improvement"
}
```

**Bulk grades for a class:**
```json
POST /api/grades/bulk
{
  "subject_id": 2,
  "class_id": 3,
  "term": "term1",
  "academic_year": "2025-2026",
  "grades": [
    { "student_id": 1, "cat_score": 35, "exam_score": 58 },
    { "student_id": 2, "cat_score": 40, "exam_score": 62 }
  ]
}
```

---

### FEES

| Method | Endpoint                        | Access        |
|--------|---------------------------------|---------------|
| GET    | /api/fees/types                 | Any logged in |
| POST   | /api/fees/types                 | Admin         |
| GET    | /api/fees/me                    | Student (own) |
| GET    | /api/fees/student/:studentId    | Admin, Parent |
| POST   | /api/fees/payments              | Admin         |
| DELETE | /api/fees/payments/:id          | Admin         |
| GET    | /api/fees/summary               | Admin         |

**Record a payment:**
```json
POST /api/fees/payments
{
  "student_id": 1,
  "fee_type_id": 1,
  "amount_paid": 75000,
  "payment_method": "mobile_money",
  "reference_no": "MOMO-2026-001",
  "payment_date": "2026-01-15"
}
```

---

### ATTENDANCE

| Method | Endpoint                                    | Access          |
|--------|---------------------------------------------|-----------------|
| POST   | /api/attendance                             | Teacher, Admin  |
| POST   | /api/attendance/bulk                        | Teacher, Admin  |
| GET    | /api/attendance/class/:classId?date=        | Teacher, Admin  |
| GET    | /api/attendance/student/:id/summary         | Admin, Teacher, Parent |

**Mark bulk attendance:**
```json
POST /api/attendance/bulk
{
  "class_id": 3,
  "date": "2026-05-08",
  "records": [
    { "student_id": 1, "status": "present" },
    { "student_id": 2, "status": "absent", "notes": "Called in sick" },
    { "student_id": 3, "status": "late" }
  ]
}
```

---

## 👤 Default Admin Login

After running `database.sql`, use these credentials to log in:
```
user_code: ADMIN-001
password:  Admin@123
```
⚠️ **Change this password immediately in production!**

---

## 🔐 User Roles & Access

| Role     | Access                                              |
|----------|-----------------------------------------------------|
| admin    | Full access to everything                           |
| teacher  | View/mark grades & attendance, view students        |
| parent   | View own child's grades, fees, attendance           |
| student  | View own grades, fees, attendance, profile          |

---

## 🚀 Connecting to the Frontend (HTML Website)

In your `school-website.html`, update the login form to call:
```javascript
const res = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_code, password })
});
const data = await res.json();
if (data.success) {
  localStorage.setItem('token', data.token);
  // redirect to portal
}
```
