# Database schema guidance

## Authoritative schema for the current API

The current Express API uses the root-level `database.sql` schema. It expects:

- `users.password`, `users.user_code`, `users.is_active`, and `users.updated_at`
- `students.user_id` for the student's login account
- `students.parent_id` for the linked parent **user account ID**
- `classes.name`, `classes.teacher_id`, and `classes.academic_year`
- `class_subjects` to map teachers to subjects in a class
- `attendance.date` and lowercase attendance status values

Use this schema when creating or comparing the database used by the current API.

## Legacy schema file

`database/schema.sql` is an earlier, incompatible design. It uses different column and table names (for example, `password_hash`, `parents`, `student_parent`, `courses`, and `attendance_date`). It is retained for historical reference and must **not** be imported into the current API database.

Do not combine the two schema files. A future migration to the legacy design would require a deliberate data migration and coordinated controller changes.

## Parent relationship limitation

The current schema supports one linked parent account per student through `students.parent_id`. The authorization middleware checks that exact relationship. Supporting multiple guardians requires a separate many-to-many relationship table and a planned migration; do not simulate it by putting arbitrary IDs in `parent_id`.

## Existing cloud database

The TiDB database was created from the current schema without sample INSERT statements. Keep that production-like database separate from local demo data. Never run the full sample-data section against a live school database without reviewing every statement first.
