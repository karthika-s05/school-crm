import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { sendSuccess } from '../utils/response';
import { ApiError, asyncHandler } from '../../middleware/error';

export const getStaffDashboard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const today = new Date().toISOString().split('T')[0];

  const { data: staffUser } = await supabase.from('staff_users').select('teacher_id').eq('user_id', userId).single();
  const teacherId = staffUser?.teacher_id;

  const [classes, todaySchedule, timetable, attendanceStats] = await Promise.all([
    supabase.from('classes').select('id, name, grade, section').eq('teacher_id', teacherId),
    supabase.from('timetable').select('*, classes(name)').eq('teacher_id', teacherId).eq('day_of_week', getDayName(new Date())).order('period_number'),
    supabase.from('timetable').select('id, classes(name)').eq('teacher_id', teacherId),
    supabase.from('attendance').select('status, date').eq('date', today),
  ]);

  const attStats = {
    present: attendanceStats.data?.filter(a => a.status === 'present').length || 0,
    absent: attendanceStats.data?.filter(a => a.status === 'absent').length || 0,
    late: attendanceStats.data?.filter(a => a.status === 'late').length || 0,
  };

  sendSuccess(res, {
    myClasses: classes.data,
    todaySchedule: todaySchedule.data,
    totalPeriods: timetable.data?.length || 0,
    attendance: attStats,
  }, 'Staff dashboard retrieved');
});

export const getMyClasses = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { data: staffUser } = await supabase.from('staff_users').select('teacher_id').eq('user_id', userId).single();

  const { data, error } = await supabase.from('classes').select('*, students(count)').eq('teacher_id', staffUser?.teacher_id);
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'My classes retrieved');
});

export const getClassStudents = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.params;
  const { data, error } = await supabase.from('students').select('*, classes(name)').eq('class_id', classId).order('name');
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Students retrieved');
});

export const markAttendanceMultiple = asyncHandler(async (req: Request, res: Response) => {
  const { records } = req.body;
  if (!Array.isArray(records)) throw new ApiError(400, 'records must be an array');

  const today = new Date().toISOString().split('T')[0];
  const recordsWithDate = records.map(r => ({ ...r, date: today }));
  const { error } = await supabase.from('attendance').upsert(recordsWithDate, { onConflict: 'student_id,date' });

  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, { marked: records.length }, 'Attendance marked successfully', 201);
});

export const getStudentAttendanceHistory = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const { data, error } = await supabase.from('attendance').select('*').eq('student_id', studentId).order('date', { ascending: false }).limit(30);
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Attendance history retrieved');
});

export const getMyTimetable = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { data: staffUser } = await supabase.from('staff_users').select('teacher_id').eq('user_id', userId).single();

  const { data, error } = await supabase.from('timetable').select('*, classes(name)').eq('teacher_id', staffUser?.teacher_id).order('day_of_week').order('period_number');
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Timetable retrieved');
});

function getDayName(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}
