import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { sendSuccess } from '../utils/response';
import { ApiError, asyncHandler } from '../../middleware/error';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const today = new Date().toISOString().split('T')[0];

  const [studentCount, teacherCount, classCount, attendanceStats, feeStats, upcomingExams] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('teachers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('classes').select('id', { count: 'exact', head: true }),
    supabase.from('attendance').select('status').eq('date', today),
    supabase.from('fees').select('amount, paid_amount, status'),
    supabase.from('exams').select('id, name, date, subject').gte('date', today).order('date').limit(5),
  ]);

  const attendance = attendanceStats.data || [];
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const fees = feeStats.data || [];
  const totalCollected = fees.reduce((s, f) => s + Number(f.paid_amount), 0);
  const totalPending = fees.filter(f => f.status !== 'paid').reduce((s, f) => s + (Number(f.amount) - Number(f.paid_amount)), 0);

  sendSuccess(res, {
    students: studentCount.count || 0,
    teachers: teacherCount.count || 0,
    classes: classCount.count || 0,
    attendance: { present: presentCount, total: attendance.length, percentage: attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0 },
    fees: { collected: totalCollected, pending: totalPending },
    upcomingExams: upcomingExams.data || [],
  }, 'Dashboard data retrieved');
});

export const getReports = asyncHandler(async (req: Request, res: Response) => {
  const { type, from_date, to_date } = req.query;

  let data: any = {};
  const from = from_date as string;
  const to = to_date as string;

  if (!type || type === 'students') {
    const { data: students } = await supabase.from('students').select('id, name, status, admission_date, classes(name)').gte('admission_date', from || '2000-01-01').lte('admission_date', to || '2100-01-01');
    data.students = students;
  }

  if (!type || type === 'fees') {
    const feesQuery = supabase.from('fees').select('amount, paid_amount, status, created_at, students(name)');
    data.fees = (await feesQuery).data;
  }

  if (!type || type === 'attendance') {
    const attQuery = supabase.from('attendance').select('date, status, students(name, classes(name))');
    data.attendance = (await attQuery).data;
  }

  sendSuccess(res, data, 'Reports generated');
});

export const getFeesDashboard = asyncHandler(async (req: Request, res: Response) => {
  const { academic_year } = req.query;
  let query = supabase.from('fees').select('amount, paid_amount, status, fee_type, students(name, class_id)');

  const { data, error } = await query;
  if (error) throw new ApiError(400, error.message);

  const stats = {
    total: data?.reduce((s: number, f: any) => s + Number(f.amount), 0) || 0,
    collected: data?.reduce((s: number, f: any) => s + Number(f.paid_amount), 0) || 0,
    pending: 0,
    byType: {} as Record<string, number>,
    byStatus: { paid: 0, pending: 0, partial: 0 },
  };

  data?.forEach((f: any) => {
    stats.pending += Number(f.amount) - Number(f.paid_amount);
    stats.byType[f.fee_type] = (stats.byType[f.fee_type] || 0) + Number(f.amount);
    if (f.status === 'paid') stats.byStatus.paid++;
    else if (f.status === 'pending') stats.byStatus.pending++;
    else stats.byStatus.partial++;
  });

  sendSuccess(res, stats, 'Fee dashboard data retrieved');
});

export const getExamsDashboard = asyncHandler(async (req: Request, res: Response) => {
  const today = new Date().toISOString().split('T')[0];

  const [past, upcoming, inProgress] = await Promise.all([
    supabase.from('exams').select('id, name, date, subject, classes(name)').lt('date', today).order('date', { ascending: false }).limit(10),
    supabase.from('exams').select('id, name, date, subject, classes(name)').gte('date', today).order('date').limit(10),
    supabase.from('exams').select('id, name, date, subject').eq('date', today),
  ]);

  sendSuccess(res, { past: past.data, upcoming: upcoming.data, inProgress: inProgress.data }, 'Exams dashboard data retrieved');
});
