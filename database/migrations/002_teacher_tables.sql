-- Drop old tables if they exist
  DROP TABLE IF EXISTS teacher_subject CASCADE;
  DROP TABLE IF EXISTS teacher_class   CASCADE;

  -- Create teacher_class
  CREATE TABLE IF NOT EXISTS teacher_class (
      id          TEXT PRIMARY KEY,
      school_id   TEXT NOT NULL,
      teacher_id  TEXT NOT NULL REFERENCES users(id),
      class_id    TEXT NOT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Create teacher_subject
  CREATE TABLE IF NOT EXISTS teacher_subject (
      id                TEXT PRIMARY KEY,
      school_id         TEXT NOT NULL,
      teacher_id        TEXT NOT NULL REFERENCES users(id),
      class_id          TEXT NOT NULL,
      subject_id        TEXT NOT NULL,
      academic_year_id  TEXT NOT NULL,
      created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- FK to schools
  ALTER TABLE teacher_class ADD CONSTRAINT fk_teacher_class_school
      FOREIGN KEY (school_id) REFERENCES schools(id);

  ALTER TABLE teacher_subject ADD CONSTRAINT fk_teacher_subject_school
      FOREIGN KEY (school_id) REFERENCES schools(id);

  ### package.json

  {
    "name": "my-school-backend",
    "version": "1.0.0",
    "scripts": {
      "migrate": "psql $DATABASE_URL -f migrations/002_teacher_tables.sql",
      "start": "node dist/index.js"
    },
    "dependencies": {
      "pg": "^8.11.0",
      // …other deps your backend needs
    }
  }

  ### render.yaml

  services:
    - type: web
      name: backend
      env: node
      plan: free
      buildCommand: npm ci && npm run migrate
      startCommand: node dist/index.js

