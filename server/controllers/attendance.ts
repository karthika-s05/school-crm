import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { sendSuccess } from '../utils/response';
import { ApiError, asyncHandler } from '../middleware/error';

export const getAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { student_id, date, class_id } = req.query;
  let query = supabase.from('attendance').select('*, students(name, class_id, classes(name))').order('date', { ascending: false });

  if (student_id) query = query.eq('student_id', student_id);
  if (date) query = query.eq('date', date);

  const { data, error } = await query;
  if (error) throw new ApiError(400, error.message);

  let filtered = data || [];
  if (class_id) {
    filtered = filtered.filter((a: any) => a.students?.class_id === class_id);
  }

  sendSuccess(res, filtered, 'Attendance records retrieved');
});

export const recordAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { student_id, date, status, notes } = req.body;
  if (!student_id || !date || !status) throw new ApiError(400, 'student_id, date, and status are required');

  const { data, error } = await supabase.from('attendance').upsert(
    { student_id, date, status, notes: notes || '' },
    { onConflict: 'student_id,date' }
  ).select().single();

  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Attendance recorded', 201);
});

export const getAttendanceStats = asyncHandler(async (req: Request, res: Response) => {
  const { student_id, start_date, end_date } = req.query;
  let query = supabase.from('attendance').select('status, count', { count: 'exact' });

  if (student_id) query = query.eq('student_id', student_id);
  if (start_date) query = query.gte('date', start_date);
  if (end_date) query = query.lte('date', end_date);

  const { data, error } = await query;
  if (error) throw new ApiError(400, error.message);

  const stats = {
    total: data?.length || 0,
    present: data?.filter((d: any) => d.status === 'present').length || 0,
    absent: data?.filter((d: any) => d.status === 'absent').length || 0,
    late: data?.filter((d: any) => d.status === 'late').length || 0,
  };
  stats.percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  sendSuccess(res, stats, 'Attendance statistics retrieved');
});

export const bulkRecordAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { records } = req.body;
  if (!Array.isArray(records)) throw new ApiError(400, 'records must be an array');

  const { data, error } = await supabase.from('attendance').upsert(records, { onConflict: 'student_id,date' }).select();
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Attendance recorded in bulk', 201);
});
