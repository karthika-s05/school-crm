import { Request, Response } from 'express';
import { db } from '../config/db';
import { sendSuccess } from '../utils/response';
import { ApiError, asyncHandler } from '../../middleware/error';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const today = new Date().toISOString().split('T')[0];

  const [students, teachers, classes, attendance, fees, exams] = await Promise.all([
    db.queryOne(`SELECT COUNT(*) as count FROM students WHERE status = 'active'`),
    db.queryOne(`SELECT COUNT(*) as count FROM teachers WHERE status = 'active'`),
    db.queryOne(`SELECT COUNT(*) as count FROM classes`),
    db.query(`SELECT status FROM attendance WHERE date = ?`, [today]),
    db.query(`SELECT amount, paid_amount, status FROM fees`),
    db.query(`SELECT id, name, date, subject FROM exams WHERE date >= ? ORDER BY date LIMIT 5`, [today]),
  ]);

  const presentCount = attendance.filter((a: any) => a.status === 'present').length;
  const totalCollected = fees.reduce((s: number, f: any) => s + Number(f.paid_amount), 0);
  const totalPending = fees.filter((f: any) => f.status !== 'paid').reduce((s: number, f: any) => s + (Number(f.amount) - Number(f.paid_amount)), 0);

  sendSuccess(res, {
    students: (students as any)?.count || 0,
    teachers: (teachers as any)?.count || 0,
    classes: (classes as any)?.count || 0,
    attendance: { present: presentCount, total: attendance.length, percentage: attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0 },
    fees: { collected: totalCollected, pending: totalPending },
    upcomingExams: exams,
  }, 'Dashboard data retrieved');
});

export const getReports = asyncHandler(async (req: Request, res: Response) => {
  const { type, from_date, to_date } = req.query;
  const result: any = {};
  const from = from_date as string || '2000-01-01';
  const to = to_date as string || '2100-01-01';

  if (!type || type === 'students') {
    result.students = await db.query(`SELECT s.id, s.name, s.status, s.admission_date, c.name as class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.admission_date BETWEEN ? AND ?`, [from, to]);
  }

  if (!type || type === 'fees') {
    result.fees = await db.query(`SELECT f.amount, f.paid_amount, f.status, s.name as student_name FROM fees f LEFT JOIN students s ON f.student_id = s.id`);
  }

  if (!type || type === 'attendance') {
    result.attendance = await db.query(`SELECT a.date, a.status, s.name as student_name, c.name as class_name FROM attendance a LEFT JOIN students s ON a.student_id = s.id LEFT JOIN classes c ON s.class_id = c.id`);
  }

  sendSuccess(res, result, 'Reports generated');
});

export const getFeesDashboard = asyncHandler(async (req: Request, res: Response) => {
  const fees = await db.query(`SELECT f.amount, f.paid_amount, f.status, f.fee_type, s.name as student_name FROM fees f LEFT JOIN students s ON f.student_id = s.id`);

  const stats: any = { total: 0, collected: 0, pending: 0, byType: {}, byStatus: { paid: 0, pending: 0, partial: 0 } };

  fees.forEach((f: any) => {
    stats.total += Number(f.amount);
    stats.collected += Number(f.paid_amount);
    stats.pending += Number(f.amount) - Number(f.paid_amount);
    stats.byType[f.fee_type] = (stats.byType[f.fee_type] || 0) + Number(f.amount);
    stats.byStatus[f.status]++;
  });

  sendSuccess(res, stats, 'Fee dashboard data retrieved');
});

export const getExamsDashboard = asyncHandler(async (req: Request, res: Response) => {
  const today = new Date().toISOString().split('T')[0];

  const [past, upcoming, inProgress] = await Promise.all([
    db.query(`SELECT e.id, e.name, e.date, e.subject, c.name as class_name FROM exams e LEFT JOIN classes c ON e.class_id = c.id WHERE e.date < ? ORDER BY e.date DESC LIMIT 10`, [today]),
    db.query(`SELECT e.id, e.name, e.date, e.subject, c.name as class_name FROM exams e LEFT JOIN classes c ON e.class_id = c.id WHERE e.date >= ? ORDER BY e.date LIMIT 10`, [today]),
    db.query(`SELECT id, name, date, subject FROM exams WHERE date = ?`, [today]),
  ]);

  sendSuccess(res, { past, upcoming, inProgress }, 'Exams dashboard data retrieved');
});
