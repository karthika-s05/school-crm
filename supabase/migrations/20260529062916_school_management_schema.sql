/*
  # School Management System - Initial Schema

  ## Overview
  Creates the full database schema for a school management dashboard.

  ## Tables

  1. **classes** - School classes/grades (e.g., Grade 1A)
     - id, name, grade, section, capacity, teacher_id (FK)

  2. **teachers** - Teacher profiles
     - id, name, email, phone, subject, qualification, join_date, status, avatar_url

  3. **students** - Student records
     - id, name, email, phone, parent_name, parent_phone, class_id (FK), dob, gender, address, admission_date, status, avatar_url

  4. **attendance** - Daily attendance records
     - id, student_id (FK), date, status (present/absent/late), notes

  5. **fees** - Fee records per student
     - id, student_id (FK), amount, paid_amount, due_date, paid_date, fee_type, status, academic_year

  6. **exams** - Exam definitions
     - id, name, class_id (FK), subject, date, max_marks, duration_minutes

  7. **exam_results** - Student exam results
     - id, exam_id (FK), student_id (FK), marks_obtained, grade, remarks

  8. **timetable** - Weekly class timetable
     - id, class_id (FK), day_of_week, period_number, subject, teacher_id (FK), start_time, end_time

  9. **library_books** - Library book catalog
     - id, title, author, isbn, category, total_copies, available_copies, published_year

  10. **library_issues** - Book issue/return records
      - id, book_id (FK), student_id (FK), issue_date, due_date, return_date, status

  11. **transport_routes** - Bus routes
      - id, route_name, vehicle_number, driver_name, driver_phone, capacity, stops

  12. **student_transport** - Students assigned to routes
      - id, student_id (FK), route_id (FK), pickup_point, monthly_fee

  13. **hostel_rooms** - Hostel room info
      - id, room_number, floor, capacity, current_occupancy, room_type, monthly_fee

  14. **hostel_allotments** - Student room allotments
      - id, student_id (FK), room_id (FK), allotment_date, vacate_date, status

  15. **notifications** - School-wide announcements
      - id, title, message, type, target_audience, created_at, created_by

  ## Security
  - RLS enabled on all tables
  - Public read/insert/update/delete policies for demo purposes (no auth required)

  ## Notes
  - All tables use UUID primary keys
  - Timestamps use timestamptz for timezone awareness
  - Foreign key constraints ensure referential integrity
*/

-- Classes
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  grade text NOT NULL,
  section text NOT NULL DEFAULT 'A',
  capacity integer NOT NULL DEFAULT 40,
  teacher_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Public insert classes" ON classes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update classes" ON classes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete classes" ON classes FOR DELETE USING (true);

-- Teachers
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text DEFAULT '',
  subject text NOT NULL,
  qualification text DEFAULT '',
  join_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'active',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read teachers" ON teachers FOR SELECT USING (true);
CREATE POLICY "Public insert teachers" ON teachers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update teachers" ON teachers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete teachers" ON teachers FOR DELETE USING (true);

-- Students
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  parent_name text DEFAULT '',
  parent_phone text DEFAULT '',
  class_id uuid REFERENCES classes(id),
  dob date,
  gender text DEFAULT 'male',
  address text DEFAULT '',
  admission_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'active',
  avatar_url text DEFAULT '',
  roll_number text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read students" ON students FOR SELECT USING (true);
CREATE POLICY "Public insert students" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update students" ON students FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete students" ON students FOR DELETE USING (true);

-- Add FK from classes to teachers
ALTER TABLE classes ADD CONSTRAINT fk_classes_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id),
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'present',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, date)
);
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read attendance" ON attendance FOR SELECT USING (true);
CREATE POLICY "Public insert attendance" ON attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update attendance" ON attendance FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete attendance" ON attendance FOR DELETE USING (true);

-- Fees
CREATE TABLE IF NOT EXISTS fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id),
  amount numeric(10,2) NOT NULL DEFAULT 0,
  paid_amount numeric(10,2) NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  paid_date date,
  fee_type text NOT NULL DEFAULT 'tuition',
  status text NOT NULL DEFAULT 'pending',
  academic_year text NOT NULL DEFAULT '2025-26',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read fees" ON fees FOR SELECT USING (true);
CREATE POLICY "Public insert fees" ON fees FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update fees" ON fees FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete fees" ON fees FOR DELETE USING (true);

-- Exams
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  class_id uuid REFERENCES classes(id),
  subject text NOT NULL,
  date date NOT NULL,
  max_marks integer NOT NULL DEFAULT 100,
  duration_minutes integer NOT NULL DEFAULT 60,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read exams" ON exams FOR SELECT USING (true);
CREATE POLICY "Public insert exams" ON exams FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update exams" ON exams FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete exams" ON exams FOR DELETE USING (true);

-- Exam Results
CREATE TABLE IF NOT EXISTS exam_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id),
  student_id uuid NOT NULL REFERENCES students(id),
  marks_obtained numeric(6,2) DEFAULT 0,
  grade text DEFAULT '',
  remarks text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(exam_id, student_id)
);
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read exam_results" ON exam_results FOR SELECT USING (true);
CREATE POLICY "Public insert exam_results" ON exam_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update exam_results" ON exam_results FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete exam_results" ON exam_results FOR DELETE USING (true);

-- Timetable
CREATE TABLE IF NOT EXISTS timetable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id),
  day_of_week text NOT NULL,
  period_number integer NOT NULL DEFAULT 1,
  subject text NOT NULL,
  teacher_id uuid REFERENCES teachers(id),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read timetable" ON timetable FOR SELECT USING (true);
CREATE POLICY "Public insert timetable" ON timetable FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update timetable" ON timetable FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete timetable" ON timetable FOR DELETE USING (true);

-- Library Books
CREATE TABLE IF NOT EXISTS library_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  isbn text DEFAULT '',
  category text DEFAULT 'General',
  total_copies integer NOT NULL DEFAULT 1,
  available_copies integer NOT NULL DEFAULT 1,
  published_year integer,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read library_books" ON library_books FOR SELECT USING (true);
CREATE POLICY "Public insert library_books" ON library_books FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update library_books" ON library_books FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete library_books" ON library_books FOR DELETE USING (true);

-- Library Issues
CREATE TABLE IF NOT EXISTS library_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES library_books(id),
  student_id uuid NOT NULL REFERENCES students(id),
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  return_date date,
  status text NOT NULL DEFAULT 'issued',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE library_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read library_issues" ON library_issues FOR SELECT USING (true);
CREATE POLICY "Public insert library_issues" ON library_issues FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update library_issues" ON library_issues FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete library_issues" ON library_issues FOR DELETE USING (true);

-- Transport Routes
CREATE TABLE IF NOT EXISTS transport_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name text NOT NULL,
  vehicle_number text NOT NULL,
  driver_name text NOT NULL,
  driver_phone text DEFAULT '',
  capacity integer NOT NULL DEFAULT 40,
  stops text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE transport_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read transport_routes" ON transport_routes FOR SELECT USING (true);
CREATE POLICY "Public insert transport_routes" ON transport_routes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update transport_routes" ON transport_routes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete transport_routes" ON transport_routes FOR DELETE USING (true);

-- Student Transport
CREATE TABLE IF NOT EXISTS student_transport (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id),
  route_id uuid NOT NULL REFERENCES transport_routes(id),
  pickup_point text NOT NULL DEFAULT '',
  monthly_fee numeric(8,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE student_transport ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read student_transport" ON student_transport FOR SELECT USING (true);
CREATE POLICY "Public insert student_transport" ON student_transport FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update student_transport" ON student_transport FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete student_transport" ON student_transport FOR DELETE USING (true);

-- Hostel Rooms
CREATE TABLE IF NOT EXISTS hostel_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number text NOT NULL UNIQUE,
  floor integer NOT NULL DEFAULT 1,
  capacity integer NOT NULL DEFAULT 4,
  current_occupancy integer NOT NULL DEFAULT 0,
  room_type text NOT NULL DEFAULT 'standard',
  monthly_fee numeric(8,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE hostel_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read hostel_rooms" ON hostel_rooms FOR SELECT USING (true);
CREATE POLICY "Public insert hostel_rooms" ON hostel_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update hostel_rooms" ON hostel_rooms FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete hostel_rooms" ON hostel_rooms FOR DELETE USING (true);

-- Hostel Allotments
CREATE TABLE IF NOT EXISTS hostel_allotments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id),
  room_id uuid NOT NULL REFERENCES hostel_rooms(id),
  allotment_date date NOT NULL DEFAULT CURRENT_DATE,
  vacate_date date,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE hostel_allotments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read hostel_allotments" ON hostel_allotments FOR SELECT USING (true);
CREATE POLICY "Public insert hostel_allotments" ON hostel_allotments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update hostel_allotments" ON hostel_allotments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete hostel_allotments" ON hostel_allotments FOR DELETE USING (true);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  target_audience text NOT NULL DEFAULT 'all',
  created_by text DEFAULT 'Admin',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Public insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update notifications" ON notifications FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete notifications" ON notifications FOR DELETE USING (true);
