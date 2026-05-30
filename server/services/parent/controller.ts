import { Request, Response } from 'express';
import { db } from '../config/db';
import { sendSuccess } from '../utils/response';
import { ApiError, asyncHandler } from '../../middleware/error';

export const getParentDashboard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const today = new Date().toISOString().split('T')[0];

  const parentUser = await db.queryOne(`SELECT id FROM parent_users WHERE user_id = ?`, [userId]);
  if (!parentUser) throw new ApiError(404, 'Parent profile not found');
  const parentId = parentUser.id;

  const children = await db.query(`SELECT pc.relationship, pc.is_primary, s.id, s.name, c.name as class_name FROM parent_children pc LEFT JOIN students s ON pc.student_id = s.id LEFT JOIN classes c ON s.class_id = c.id WHERE pc.parent_user_id = ?`, [parentId]);
  const childIds = children.map((c: any) => c.id);

  if (childIds.length === 0) {
    return sendSuccess(res, { children: [], totalFeesPending: 0, recentResults: [], totalChildren: 0 }, 'Parent dashboard retrieved');
  }

  const placeholders = childIds.map(() => '?').join(',');
  const [attendance, fees, results] = await Promise.all([
    db.query(`SELECT student_id, status FROM attendance WHERE date = ? AND student_id IN (${placeholders})`, [today, ...childIds]),
    db.query(`SELECT student_id, amount, paid_amount, status, due_date FROM fees WHERE student_id IN (${placeholders})`, childIds),
    db.query(`SELECT r.student_id, r.marks_obtained, r.grade, e.name, e.subject FROM exam_results r LEFT JOIN exams e ON r.exam_id = e.id WHERE r.student_id IN (${placeholders}) ORDER BY r.created_at DESC LIMIT 10`, childIds),
  ]);

  const childSummary = children.map((child: any) => {
    const attToday = attendance.find((a: any) => a.student_id === child.id);
    const childFees = fees.filter((f: any) => f.student_id === child.id);
    return {
      id: child.id, name: child.name, class: child.class_name, relationship: child.relationship,
      todayStatus: attToday?.status || 'not_marked',
      fees: { pending: childFees.filter((f: any) => f.status !== 'paid').length },
    };
  });

  const totalPending = fees.reduce((s: number, f: any) => s + (Number(f.amount) - Number(f.paid_amount)), 0);

  sendSuccess(res, { children: childSummary, totalFeesPending: totalPending, recentResults: results, totalChildren: children.length }, 'Parent dashboard retrieved');
});

export const getChildren = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const parentUser = await db.queryOne(`SELECT id FROM parent_users WHERE user_id = ?`, [userId]);

  const data = await db.query(`SELECT pc.relationship, pc.is_primary, s.id, s.name, s.roll_number, c.name as class_name FROM parent_children pc LEFT JOIN students s ON pc.student_id = s.id LEFT JOIN classes c ON s.class_id = c.id WHERE pc.parent_user_id = ?`, [parentUser?.id]);
  sendSuccess(res, data, 'Children retrieved');
});

export const getChildAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const data = await db.query(`SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC LIMIT 30`, [studentId]);
  sendSuccess(res, data, 'Attendance retrieved');
});

export const getChildFees = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const data = await db.query(`SELECT * FROM fees WHERE student_id = ? ORDER BY due_date ASC`, [studentId]);
  sendSuccess(res, data, 'Fees retrieved');
});

export const payFee = asyncHandler(async (req: Request, res: Response) => {
  const { feeId } = req.params;
  const { amount } = req.body;

  const fee = await db.queryOne(`SELECT * FROM fees WHERE id = ?`, [feeId]);
  if (!fee) throw new ApiError(404, 'Fee record not found');

  const newPaid = Number(fee.paid_amount) + (Number(amount) || 0);
  const status = newPaid >= Number(fee.amount) ? 'paid' : newPaid > 0 ? 'partial' : 'pending';
  const paidDate = status === 'paid' ? new Date().toISOString().split('T')[0] : fee.paid_date;

  await db.update(`UPDATE fees SET paid_amount = ?, status = ?, paid_date = ? WHERE id = ?`, [newPaid, status, paidDate, feeId]);
  const updatedFee = await db.queryOne(`SELECT * FROM fees WHERE id = ?`, [feeId]);
  sendSuccess(res, updatedFee, 'Payment recorded');
});

export const getChildResults = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const data = await db.query(`SELECT r.*, e.name as exam_name, e.subject, e.date, e.max_marks FROM exam_results r LEFT JOIN exams e ON r.exam_id = e.id WHERE r.student_id = ? ORDER BY r.created_at DESC`, [studentId]);
  sendSuccess(res, data, 'Results retrieved');
});

export const getChildTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const student = await db.queryOne(`SELECT class_id FROM students WHERE id = ?`, [studentId]);
  if (!student) throw new ApiError(404, 'Student not found');

  const data = await db.query(`SELECT t.*, tc.name as teacher_name FROM timetable t LEFT JOIN teachers tc ON t.teacher_id = tc.id WHERE t.class_id = ? ORDER BY t.day_of_week, t.period_number`, [student.class_id]);
  sendSuccess(res, data, 'Timetable retrieved');
});

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const data = await db.query(`SELECT * FROM notifications WHERE target_audience IN ('all', 'parents') ORDER BY created_at DESC LIMIT 20`);
  sendSuccess(res, data, 'Notifications retrieved');
});
