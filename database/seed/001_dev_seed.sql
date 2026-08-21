INSERT INTO schools (id, name, registration_number, address, region, district, phone, email, website, logo, motto, school_type, ownership, status)
VALUES
  ('s-1', 'Example International School', 'REG-001', 'Dar es Salaam', 'Dar es Salaam', 'Kinondoni', '+255712345678', 'info@example.edu', 'https://example.edu', null, 'Excellence through Knowledge', 'International', 'Private', 'ACTIVE'),
  ('s-2', 'Green Valley Academy', 'REG-002', 'Arusha', 'Arusha', 'Arusha City', '+255765432109', 'info@greenvalley.ac.tz', 'https://greenvalley.ac.tz', null, 'Learning for Tomorrow', 'National', 'Private', 'ACTIVE');

INSERT INTO users (id, school_id, name, email, phone, password_hash, role, status, last_login)
VALUES
  ('u-1', 's-1', 'System Admin', 'admin@example.com', '+255700000001', '$2a$10$1U5YQz8xLzW2g0zD4J5xL.5z2m8kBO3b2G5v7m2Jm3zLw7nW4c9G', 'SUPER_ADMIN', 'ACTIVE', NOW()),
  ('u-2', 's-1', 'School Admin', 'schooladmin@example.com', '+255700000002', '$2a$10$1U5YQz8xLzW2g0zD4J5xL.5z2m8kBO3b2G5v7m2Jm3zLw7nW4c9G', 'SCHOOL_ADMIN', 'ACTIVE', NOW()),
  ('u-3', 's-1', 'Teacher User', 'teacher@example.com', '+255700000003', '$2a$10$1U5YQz8xLzW2g0zD4J5xL.5z2m8kBO3b2G5v7m2Jm3zLw7nW4c9G', 'TEACHER', 'ACTIVE', NOW()),
  ('u-4', 's-1', 'Accountant User', 'accountant@example.com', '+255700000004', '$2a$10$1U5YQz8xLzW2g0zD4J5xL.5z2m8kBO3b2G5v7m2Jm3zLw7nW4c9G', 'ACCOUNTANT', 'ACTIVE', NOW()),
  ('u-5', 's-1', 'Parent User', 'parent@example.com', '+255700000005', '$2a$10$1U5YQz8xLzW2g0zD4J5xL.5z2m8kBO3b2G5v7m2Jm3zLw7nW4c9G', 'PARENT', 'ACTIVE', NOW()),
  ('u-6', 's-2', 'Second School Admin', 'schooladmin2@example.com', '+255700000006', '$2a$10$1U5YQz8xLzW2g0zD4J5xL.5z2m8kBO3b2G5v7m2Jm3zLw7nW4c9G', 'SCHOOL_ADMIN', 'ACTIVE', NOW());

INSERT INTO roles (id, school_id, name, description)
VALUES
  ('role-1', 's-1', 'SUPER_ADMIN', 'Platform-wide access'),
  ('role-2', 's-1', 'SCHOOL_ADMIN', 'School level administration'),
  ('role-3', 's-1', 'TEACHER', 'Teacher access to classes and marks'),
  ('role-4', 's-1', 'ACCOUNTANT', 'Fees and payments access'),
  ('role-5', 's-1', 'PARENT', 'Parent access to children records');

INSERT INTO permissions (id, role_id, permission_key)
VALUES
  ('perm-1', 'role-1', 'schools.manage'),
  ('perm-2', 'role-1', 'users.manage'),
  ('perm-3', 'role-1', 'students.manage'),
  ('perm-4', 'role-1', 'fees.manage'),
  ('perm-5', 'role-5', 'children.view'),
  ('perm-6', 'role-5', 'fees.view');

INSERT INTO academic_years (id, school_id, name, start_date, end_date, status)
VALUES
  ('ay-1', 's-1', '2026', '2026-01-01', '2026-12-31', 'ACTIVE');

INSERT INTO classes (id, school_id, academic_year_id, name, level, status)
VALUES
  ('cls-1', 's-1', 'ay-1', 'Form 1', 'Secondary', 'ACTIVE'),
  ('cls-2', 's-1', 'ay-1', 'Form 2', 'Secondary', 'ACTIVE');

INSERT INTO streams (id, school_id, name)
VALUES
  ('str-1', 's-1', 'A'),
  ('str-2', 's-1', 'B');

INSERT INTO subjects (id, school_id, name, code, category, status)
VALUES
  ('sub-1', 's-1', 'Mathematics', 'MATH', 'Core', 'ACTIVE'),
  ('sub-2', 's-1', 'English', 'ENG', 'Core', 'ACTIVE');

INSERT INTO students (id, school_id, admission_number, first_name, middle_name, last_name, gender, date_of_birth, place_of_birth, nationality, phone, email, address, photo, admission_date, status)
VALUES
  ('st-1', 's-1', 'ADM-1001', 'Alice', 'Mwanza', 'Juma', 'FEMALE', '2012-03-04', 'Dar es Salaam', 'Tanzanian', '+255711000001', 'alice@student.example', 'Dar es Salaam', NULL, '2026-01-10', 'ACTIVE'),
  ('st-2', 's-1', 'ADM-1002', 'Daniel', 'Nuru', 'Moshi', 'MALE', '2011-08-12', 'Arusha', 'Tanzanian', '+255711000002', 'daniel@student.example', 'Arusha', NULL, '2026-01-12', 'ACTIVE');

INSERT INTO guardians (id, school_id, name, relationship, phone, email, address, occupation)
VALUES
  ('g-1', 's-1', 'Mary Juma', 'Mother', '+255722000001', 'mary@example.com', 'Dar es Salaam', 'Teacher'),
  ('g-2', 's-1', 'John Moshi', 'Father', '+255722000002', 'john@example.com', 'Arusha', 'Businessman');

INSERT INTO student_guardians (id, student_id, guardian_id, school_id)
VALUES
  ('sg-1', 'st-1', 'g-1', 's-1'),
  ('sg-2', 'st-2', 'g-2', 's-1');

INSERT INTO fee_structures (id, school_id, academic_year_id, class_id, fee_name, amount, frequency, due_date)
VALUES
  ('fs-1', 's-1', 'ay-1', 'cls-1', 'School Fees', 250000, 'TERMLY', '2026-03-31');

INSERT INTO invoices (id, school_id, student_id, invoice_number, fee_item, amount, discount, total, due_date, status)
VALUES
  ('inv-1', 's-1', 'st-1', 'INV-1001', 'School Fees', 250000, 0, 250000, '2026-03-31', 'UNPAID');

INSERT INTO payments (id, school_id, student_id, invoice_id, amount, payment_reference, control_number, payment_method, provider, transaction_id, status, paid_at)
VALUES
  ('pay-1', 's-1', 'st-1', 'inv-1', 100000, 'REF-1001', 'CTRL-1001', 'BANK', 'MockPaymentProvider', 'TXN-1001', 'PAID', NOW());

INSERT INTO notifications (id, school_id, recipient_id, type, channel, subject, body, status)
VALUES
  ('note-1', 's-1', 'u-5', 'Fee invoice', 'EMAIL', 'School Fees Invoice', 'Your invoice is ready.', 'SENT');

INSERT INTO audit_logs (id, school_id, user_id, action, entity, entity_id, ip_address, metadata)
VALUES
  ('audit-1', 's-1', 'u-1', 'login', 'user', 'u-1', '127.0.0.1', '{"source": "web"}');
