CREATE TABLE IF NOT EXISTS schools (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(100) NOT NULL,
  address VARCHAR(255) NOT NULL,
  region VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  logo VARCHAR(255),
  motto VARCHAR(255),
  school_type VARCHAR(50),
  ownership VARCHAR(50),
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_schools_registration_number (registration_number),
  KEY idx_schools_status (status)
);

CREATE TABLE IF NOT EXISTS roles (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NULL,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_roles_school_id (school_id),
  KEY idx_roles_name (name)
);

CREATE TABLE IF NOT EXISTS permissions (
  id CHAR(36) PRIMARY KEY,
  role_id CHAR(36) NOT NULL,
  permission_key VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_permissions_role_id (role_id),
  UNIQUE KEY uq_permissions_role_key (role_id, permission_key)
);

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_school_email (school_id, email),
  KEY idx_users_school_id (school_id),
  KEY idx_users_role (role),
  CONSTRAINT fk_users_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE TABLE IF NOT EXISTS students (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  admission_number VARCHAR(100) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  gender ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
  date_of_birth DATE NOT NULL,
  place_of_birth VARCHAR(255),
  nationality VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  photo VARCHAR(255),
  admission_date DATE NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_students_school_admission_number (school_id, admission_number),
  KEY idx_students_school_id (school_id),
  KEY idx_students_status (status),
  CONSTRAINT fk_students_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE TABLE IF NOT EXISTS guardians (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  relationship VARCHAR(50) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  occupation VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_guardians_school_id (school_id),
  CONSTRAINT fk_guardians_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE TABLE IF NOT EXISTS student_guardians (
  id CHAR(36) PRIMARY KEY,
  student_id CHAR(36) NOT NULL,
  guardian_id CHAR(36) NOT NULL,
  school_id CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_student_guardians (student_id, guardian_id),
  KEY idx_student_guardians_student_id (student_id),
  KEY idx_student_guardians_school_id (school_id),
  CONSTRAINT fk_student_guardians_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_student_guardians_guardian FOREIGN KEY (guardian_id) REFERENCES guardians(id),
  CONSTRAINT fk_student_guardians_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE TABLE IF NOT EXISTS academic_years (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('ACTIVE', 'UPCOMING', 'CLOSED') NOT NULL DEFAULT 'UPCOMING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_academic_years_school_id (school_id),
  CONSTRAINT fk_academic_years_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE TABLE IF NOT EXISTS classes (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  academic_year_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  level VARCHAR(100) NOT NULL,
  status ENUM('ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_classes_school_year_name (school_id, academic_year_id, name),
  KEY idx_classes_school_id (school_id),
  CONSTRAINT fk_classes_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT fk_classes_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

CREATE TABLE IF NOT EXISTS streams (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  name VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_streams_school_name (school_id, name),
  CONSTRAINT fk_streams_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE TABLE IF NOT EXISTS subjects (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_subjects_school_code (school_id, code),
  KEY idx_subjects_school_id (school_id),
  CONSTRAINT fk_subjects_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE TABLE IF NOT EXISTS teacher_assignments (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  teacher_id CHAR(36) NOT NULL,
  class_id CHAR(36) NOT NULL,
  stream_id CHAR(36) NULL,
  subject_id CHAR(36) NOT NULL,
  academic_year_id CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_teacher_assignments (teacher_id, class_id, subject_id, academic_year_id),
  KEY idx_teacher_assignments_school_id (school_id),
  CONSTRAINT fk_teacher_assignments_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE TABLE IF NOT EXISTS attendance (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  academic_year_id CHAR(36) NOT NULL,
  class_id CHAR(36) NOT NULL,
  date DATE NOT NULL,
  status ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED') NOT NULL,
  reason VARCHAR(255),
  recorded_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_attendance_student_date (student_id, date),
  KEY idx_attendance_school_id (school_id),
  CONSTRAINT fk_attendance_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE TABLE IF NOT EXISTS exams (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  academic_year_id CHAR(36) NOT NULL,
  term VARCHAR(50) NOT NULL,
  class_id CHAR(36) NOT NULL,
  exam_date DATE NOT NULL,
  status ENUM('DRAFT', 'OPEN', 'CLOSED') NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_exams_school_id (school_id),
  CONSTRAINT fk_exams_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE TABLE IF NOT EXISTS grades (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  name VARCHAR(50) NOT NULL,
  min_mark INT NOT NULL,
  max_mark INT NOT NULL,
  grade_value VARCHAR(10) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_grades_school_value (school_id, grade_value),
  CONSTRAINT fk_grades_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE TABLE IF NOT EXISTS marks (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  subject_id CHAR(36) NOT NULL,
  exam_id CHAR(36) NOT NULL,
  marks DECIMAL(5,2) NOT NULL,
  grade VARCHAR(10),
  remarks TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_marks_exam_student_subject (student_id, exam_id, subject_id),
  KEY idx_marks_school_id (school_id),
  CONSTRAINT fk_marks_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE TABLE IF NOT EXISTS fee_structures (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  academic_year_id CHAR(36) NOT NULL,
  class_id CHAR(36) NOT NULL,
  fee_name VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  frequency VARCHAR(50) NOT NULL,
  due_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_fee_structures_school_id (school_id),
  CONSTRAINT fk_fee_structures_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  invoice_number VARCHAR(100) NOT NULL,
  fee_item VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'UNPAID',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_invoices_number (school_id, invoice_number),
  KEY idx_invoices_school_id (school_id),
  CONSTRAINT fk_invoices_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  invoice_id CHAR(36) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_reference VARCHAR(100) NOT NULL,
  control_number VARCHAR(100),
  payment_method VARCHAR(50) NOT NULL,
  provider VARCHAR(100),
  transaction_id VARCHAR(100),
  status ENUM('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payment_reference (school_id, payment_reference),
  KEY idx_payments_school_id (school_id),
  CONSTRAINT fk_payments_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE TABLE IF NOT EXISTS receipts (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  receipt_number VARCHAR(100) NOT NULL,
  payment_id CHAR(36) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_receipt_number (school_id, receipt_number),
  CONSTRAINT fk_receipts_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  payment_id CHAR(36) NOT NULL,
  provider_name VARCHAR(100) NOT NULL,
  raw_payload JSON,
  signature VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_payment_transactions_school_id (school_id),
  CONSTRAINT fk_payment_transactions_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  recipient_id CHAR(36) NOT NULL,
  type VARCHAR(50) NOT NULL,
  channel ENUM('SMS', 'EMAIL', 'IN_APP') NOT NULL,
  subject VARCHAR(255),
  body TEXT NOT NULL,
  status ENUM('QUEUED', 'SENT', 'FAILED') NOT NULL DEFAULT 'QUEUED',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notifications_school_id (school_id),
  CONSTRAINT fk_notifications_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE TABLE IF NOT EXISTS announcements (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_announcements_school_id (school_id),
  CONSTRAINT fk_announcements_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  action VARCHAR(255) NOT NULL,
  entity VARCHAR(255) NOT NULL,
  entity_id VARCHAR(255),
  ip_address VARCHAR(60),
  metadata JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_logs_school_id (school_id),
  KEY idx_audit_logs_user_id (user_id),
  CONSTRAINT fk_audit_logs_school FOREIGN KEY (school_id) REFERENCES schools(id)
);
