import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Student = {
  id: string;
  name: string;
  email: string;
  phone: string;
  parent_name: string;
  parent_phone: string;
  class_id: string | null;
  dob: string | null;
  gender: string;
  address: string;
  admission_date: string;
  status: string;
  roll_number: string;
  created_at: string;
  classes?: Class;
};

export type Teacher = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  qualification: string;
  join_date: string;
  status: string;
  created_at: string;
};

export type Class = {
  id: string;
  name: string;
  grade: string;
  section: string;
  capacity: number;
  teacher_id: string | null;
  created_at: string;
  teachers?: Teacher;
};

export type Attendance = {
  id: string;
  student_id: string;
  date: string;
  status: string;
  notes: string;
  created_at: string;
  students?: Student;
};

export type Fee = {
  id: string;
  student_id: string;
  amount: number;
  paid_amount: number;
  due_date: string;
  paid_date: string | null;
  fee_type: string;
  status: string;
  academic_year: string;
  created_at: string;
  students?: Student;
};

export type Exam = {
  id: string;
  name: string;
  class_id: string | null;
  subject: string;
  date: string;
  max_marks: number;
  duration_minutes: number;
  created_at: string;
  classes?: Class;
};

export type ExamResult = {
  id: string;
  exam_id: string;
  student_id: string;
  marks_obtained: number;
  grade: string;
  remarks: string;
  created_at: string;
  students?: Student;
  exams?: Exam;
};

export type TimetableEntry = {
  id: string;
  class_id: string | null;
  day_of_week: string;
  period_number: number;
  subject: string;
  teacher_id: string | null;
  start_time: string;
  end_time: string;
  classes?: Class;
  teachers?: Teacher;
};

export type LibraryBook = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  total_copies: number;
  available_copies: number;
  published_year: number | null;
  created_at: string;
};

export type LibraryIssue = {
  id: string;
  book_id: string;
  student_id: string;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
  created_at: string;
  library_books?: LibraryBook;
  students?: Student;
};

export type TransportRoute = {
  id: string;
  route_name: string;
  vehicle_number: string;
  driver_name: string;
  driver_phone: string;
  capacity: number;
  stops: string[];
  created_at: string;
};

export type HostelRoom = {
  id: string;
  room_number: string;
  floor: number;
  capacity: number;
  current_occupancy: number;
  room_type: string;
  monthly_fee: number;
  created_at: string;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  target_audience: string;
  created_by: string;
  is_read: boolean;
  created_at: string;
};
