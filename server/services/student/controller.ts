import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { sendSuccess } from '../utils/response';
import { ApiError, asyncHandler } from '../../middleware/error';

export const getStudentDashboard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const { data: studentUser } = await supabase.from('student_users').select('student_id, students(*, classes(name))').eq('user_id', userId).single();
  if (!studentUser) throw new ApiError(404, 'Student profile not found');

  const studentId = (studentUser.students as any)?.id;
  const today = new Date().toISOString().split('T')[0];

  const [attendance, fees, exams, library] = await Promise.all([
    supabase.from('attendance').select('status').eq('student_id', studentId).eq('date', today).single(),
    supabase.from('fees').select('amount, paid_amount, status, due_date').eq('student_id', studentId),
    supabase.from('exam_results').select('marks_obtained, grade, exams(name, subject, max_marks)').eq('student_id', studentId).order('created_at', { ascending: false }).limit(5),
    supabase.from('library_issues').select('*, library_books(title)').eq('student_id', studentId).eq('status', 'issued'),
  ]);

  const totalFees = fees.data?.reduce((s: number, f: any) => s + Number(f.amount), 0) || 0;
  const paidFees = fees.data?.reduce((s: number, f: any) => s + Number(f.paid_amount), 0) || 0;

  sendSuccess(res, {
    student: studentUser.students,
    todayAttendance: attendance.data?.status || 'not_marked',
    fees: { total: totalFees, paid: paidFees, pending: totalFees - paidFees },
    recentResults: exams.data,
    borrowedBooks: library.data,
  }, 'Student dashboard retrieved');
});

export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { data, error } = await supabase.from('student_users').select('*, students(*, classes(name))').eq('user_id', userId).single();
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Profile retrieved');
});

export const getMyAttendanceHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { data: studentUser } = await supabase.from('student_users').select('student_id').eq('user_id', userId).single();

  const { data, error } = await supabase.from('attendance').select('date, status, notes').eq('student_id', studentUser?.student_id).order('date', { ascending: false }).limit(60);
  if (error) throw new ApiError(400, error.message);

  const stats = { present: 0, absent: 0, late: 0 };
  data?.forEach(a => {
    if (a.status === 'present') stats.present++;
    else if (a.status === 'absent') stats.absent++;
    else stats.late++;
  });

  sendSuccess(res, { history: data, stats }, 'Attendance history retrieved');
});

export const getMyFees = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { data: studentUser } = await supabase.from('student_users').select('student_id').eq('user_id', userId).single();

  const { data, error } = await supabase.from('fees').select('*').eq('student_id', studentUser?.student_id).order('due_date', { ascending: true });
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Fees retrieved');
});

export const getMyResults = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { data: studentUser } = await supabase.from('student_users').select('student_id').eq('user_id', userId).single();

  const { data, error } = await supabase.from('exam_results').select('*, exams(name, subject, date, max_marks)').eq('student_id', studentUser?.student_id).order('created_at', { ascending: false });
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Results retrieved');
});

export const getMyTimetable = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { data: studentUser } = await supabase.from('student_users').select('students(class_id)').eq('user_id', userId).single();
  const classId = (studentUser?.students as any)?.class_id;
  if (!classId) throw new ApiError(404, 'Class not found');

  const { data, error } = await supabase.from('timetable').select('*, teachers(name)').eq('class_id', classId).order('day_of_week').order('period_number');
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Timetable retrieved');
});

export const getLibraryBooks = asyncHandler(async (req: Request, res: Response) => {
  const { search, category } = req.query;
  let query = supabase.from('library_books').select('*').gt('available_copies', 0).order('title');

  if (search) query = query.ilike('title', `%${search}%`);
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Library books retrieved');
});

export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const { data, error } = await supabase.from('notifications').select('*').or(`target_audience.eq.all,target_audience.eq.students`).order('created_at', { ascending: false }).limit(20);
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Notifications retrieved');
});
