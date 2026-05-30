import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { sendSuccess } from '../utils/response';
import { ApiError, asyncHandler } from '../../middleware/error';

export const getParentDashboard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const today = new Date().toISOString().split('T')[0];

  const { data: parentUser } = await supabase.from('parent_users').select('id, parent_children(students(id, name, class_id, classes(name)))').eq('user_id', userId).single();
  if (!parentUser) throw new ApiError(404, 'Parent profile not found');

  const children = (parentUser.parent_children as any[])?.map(pc => pc.students) || [];
  const childIds = children.map((c: any) => c.id);

  const [attendance, fees, results] = await Promise.all([
    supabase.from('attendance').select('student_id, status').eq('date', today).in('student_id', childIds),
    supabase.from('fees').select('student_id, amount, paid_amount, status, due_date').in('student_id', childIds),
    supabase.from('exam_results').select('student_id, marks_obtained, grade, exams(name, subject, max_marks)').in('student_id', childIds).order('created_at', { ascending: false }).limit(10),
  ]);

  const childSummary = children.map((child: any) => {
    const attToday = attendance.data?.find(a => a.student_id === child.id);
    const childFees = fees.data?.filter(f => f.student_id === child.id) || [];
    return {
      id: child.id,
      name: child.name,
      class: child.classes?.name,
      todayStatus: attToday?.status || 'not_marked',
      fees: { pending: childFees.filter(f => f.status !== 'paid').length },
    };
  });

  const totalPending = fees.data?.reduce((s: number, f: any) => s + (Number(f.amount) - Number(f.paid_amount)), 0) || 0;

  sendSuccess(res, {
    children: childSummary,
    totalFeesPending: totalPending,
    recentResults: results.data,
    totalChildren: children.length,
  }, 'Parent dashboard retrieved');
});

export const getChildren = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { data: parentUser } = await supabase.from('parent_users').select('id').eq('user_id', userId).single();

  const { data, error } = await supabase.from('parent_children').select('students(id, name, roll_number, classes(name)), relationship, is_primary').eq('parent_user_id', parentUser?.id);
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Children retrieved');
});

export const getChildAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const userId = req.user?.id;

  // Verify access
  const { data: relation } = await supabase.from('parent_children').select('id').eq('student_id', studentId).eq('parent_user_id', await getparentId(userId!)).single();
  if (!relation) throw new ApiError(403, 'Not authorized to view this student');

  const { data, error } = await supabase.from('attendance').select('*').eq('student_id', studentId).order('date', { ascending: false }).limit(30);
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Attendance retrieved');
});

export const getChildFees = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const userId = req.user?.id;

  const { data, error } = await supabase.from('fees').select('*').eq('student_id', studentId).order('due_date', { ascending: true });
  if (error) throw new ApiError(400, error.message);

  sendSuccess(res, data, 'Fees retrieved');
});

export const payFee = asyncHandler(async (req: Request, res: Response) => {
  const { feeId } = req.params;
  const { amount } = req.body;

  const { data: fee } = await supabase.from('fees').select('*').eq('id', feeId).single();
  if (!fee) throw new ApiError(404, 'Fee record not found');

  const newPaid = Number(fee.paid_amount) + (Number(amount) || 0);
  const status = newPaid >= Number(fee.amount) ? 'paid' : newPaid > 0 ? 'partial' : 'pending';

  const { data, error } = await supabase.from('fees').update({
    paid_amount: newPaid,
    status,
    paid_date: status === 'paid' ? null : fee.paid_date,
  }).eq('id', feeId).select().single();

  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Payment recorded');
});

export const getChildResults = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;

  const { data, error } = await supabase.from('exam_results').select('*, exams(name, subject, date, max_marks)').eq('student_id', studentId).order('created_at', { ascending: false });
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Results retrieved');
});

export const getChildTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;

  const { data: student } = await supabase.from('students').select('class_id').eq('id', studentId).single();
  if (!student) throw new ApiError(404, 'Student not found');

  const { data, error } = await supabase.from('timetable').select('*, teachers(name)').eq('class_id', student.class_id).order('day_of_week').order('period_number');
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Timetable retrieved');
});

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('notifications').select('*').or(`target_audience.eq.all,target_audience.eq.parents`).order('created_at', { ascending: false }).limit(20);
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Notifications retrieved');
});

async function getparentId(userId: string) {
  const { data } = await supabase.from('parent_users').select('id').eq('user_id', userId).single();
  return data?.id;
}
