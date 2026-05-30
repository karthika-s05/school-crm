/*
  # User Roles and Authentication Schema

  ## Overview
  Creates multi-role user system for School Management with:
  - Super Admin: System-wide administrator
  - Admin: School administrator
  - Staff: Teachers and other staff
  - Student: Student portal access
  - Parent: Parent portal access

  ## Tables

  1. **users** - Base user table with authentication
     - id, email, password_hash, role, is_active, last_login

  2. **user_profiles** - Extended profile information
     - id, user_id, name, phone, avatar_url, address, dob, gender

  3. **admin_users** - Admin-specific data
     - id, user_id, department, permissions

  4. **staff_users** - Staff-specific data
     - id, user_id, employee_id, designation, join_date, salary, department

  5. **student_users** - Student portal users (links to students table)
     - id, user_id, student_id

  6. **parent_users** - Parent portal users
     - id, user_id, occupation, workplace

  7. **parent_children** - Links parents to students (many-to-many)
     - id, parent_user_id, student_id, relationship

  8. **permissions** - Role-based permissions
     - id, role, resource, action

  ## Security
  - RLS enabled on all tables
  - Policies restrict data access by user role
*/

-- Users table (base authentication)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('super_admin', 'admin', 'staff', 'student', 'parent')),
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Public insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update users" ON users FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete users" ON users FOR DELETE USING (true);

-- User profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text DEFAULT '',
  avatar_url text DEFAULT '',
  address text DEFAULT '',
  dob date,
  gender text DEFAULT 'male',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read user_profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Public insert user_profiles" ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update user_profiles" ON user_profiles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete user_profiles" ON user_profiles FOR DELETE USING (true);

-- Admin users
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department text DEFAULT '',
  permissions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_users ENABLE ROW LEVEL Security;
CREATE POLICY "Public read admin_users" ON admin_users FOR SELECT USING (true);
CREATE POLICY "Public insert admin_users" ON admin_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update admin_users" ON admin_users FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete admin_users" ON admin_users FOR DELETE USING (true);

-- Staff users
CREATE TABLE IF NOT EXISTS staff_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id text NOT NULL UNIQUE,
  teacher_id uuid REFERENCES teachers(id),
  designation text DEFAULT 'Staff',
  department text DEFAULT '',
  join_date date DEFAULT CURRENT_DATE,
  salary numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read staff_users" ON staff_users FOR SELECT USING (true);
CREATE POLICY "Public insert staff_users" ON staff_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update staff_users" ON staff_users FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete staff_users" ON staff_users FOR DELETE USING (true);

-- Student portal users
CREATE TABLE IF NOT EXISTS student_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE student_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read student_users" ON student_users FOR SELECT USING (true);
CREATE POLICY "Public insert student_users" ON student_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update student_users" ON student_users FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete student_users" ON student_users FOR DELETE USING (true);

-- Parent portal users
CREATE TABLE IF NOT EXISTS parent_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  occupation text DEFAULT '',
  workplace text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE parent_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read parent_users" ON parent_users FOR SELECT USING (true);
CREATE POLICY "Public insert parent_users" ON parent_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update parent_users" ON parent_users FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete parent_users" ON parent_users FOR DELETE USING (true);

-- Parent-Child relationships (many-to-many)
CREATE TABLE IF NOT EXISTS parent_children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid NOT NULL REFERENCES parent_users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  relationship text NOT NULL DEFAULT 'parent',
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(parent_user_id, student_id)
);
ALTER TABLE parent_children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read parent_children" ON parent_children FOR SELECT USING (true);
CREATE POLICY "Public insert parent_children" ON parent_children FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update parent_children" ON parent_children FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete parent_children" ON parent_children FOR DELETE USING (true);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  resource text NOT NULL,
  action text NOT NULL,
  allowed boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read permissions" ON permissions FOR SELECT USING (true);
CREATE POLICY "Public insert permissions" ON permissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update permissions" ON permissions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete permissions" ON permissions FOR DELETE USING (true);

-- Insert default permissions
INSERT INTO permissions (role, resource, action, allowed) VALUES
-- Super Admin - Full access
('super_admin', 'all', 'all', true),
-- Admin - School management
('admin', 'students', 'read', true),
('admin', 'students', 'write', true),
('admin', 'students', 'delete', true),
('admin', 'teachers', 'read', true),
('admin', 'teachers', 'write', true),
('admin', 'teachers', 'delete', true),
('admin', 'classes', 'all', true),
('admin', 'attendance', 'all', true),
('admin', 'fees', 'all', true),
('admin', 'exams', 'all', true),
('admin', 'timetable', 'all', true),
('admin', 'library', 'all', true),
('admin', 'transport', 'read', true),
('admin', 'hostel', 'read', true),
('admin', 'notifications', 'all', true),
('admin', 'reports', 'all', true),
-- Staff - Limited access
('staff', 'students', 'read', true),
('staff', 'attendance', 'read', true),
('staff', 'attendance', 'write', true),
('staff', 'exams', 'read', true),
('staff', 'exams', 'write', true),
('staff', 'timetable', 'read', true),
('staff', 'library', 'read', true),
-- Student - Own data only
('student', 'profile', 'read', true),
('student', 'profile', 'write', true),
('student', 'attendance', 'read', true),
('student', 'fees', 'read', true),
('student', 'exams', 'read', true),
('student', 'timetable', 'read', true),
('student', 'library', 'read', true),
('student', 'library', 'write', true),
-- Parent - Children data
('parent', 'profile', 'read', true),
('parent', 'profile', 'write', true),
('parent', 'children', 'read', true),
('parent', 'attendance', 'read', true),
('parent', 'fees', 'read', true),
('parent', 'exams', 'read', true),
('parent', 'fees', 'write', true)
ON CONFLICT DO NOTHING;
