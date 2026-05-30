const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint),
  post: <T>(endpoint: string, data?: any) => apiRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data?: any) => apiRequest<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};

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
