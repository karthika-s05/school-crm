import { Request, Response } from 'express';
import { db } from '../config/db';
import { sendSuccess } from '../utils/response';
import { ApiError, asyncHandler } from '../../middleware/error';

export const getStudentDashboard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const today = new Date().toISOString().split('T')[0];

  const studentUser = await db.queryOne(`SELECT su.*, s.name, s.class_id, c.name as class_name FROM student_users su LEFT JOIN students s ON su.student_id = s.id LEFT JOIN classes c ON s.class_id = c.id WHERE su.user_id = ?`, [userId]);
  if (!studentUser) throw new ApiError(404, 'Student profile not found');
  const studentId = studentUser.student_id;

  const [attendance, fees, exams] = await Promise.all([
    db.queryOne(`SELECT status FROM attendance WHERE student_id = ? AND date = ?`, [studentId, today]),
    db.query(`SELECT amount, paid_amount, status, due_date FROM fees WHERE student_id = ?`, [studentId]),
    db.query(`SELECT r.marks_obtained, r.grade, e.name, e.subject, e.max_marks FROM exam_results r LEFT JOIN exams e ON r.exam_id = e.id WHERE r.student_id = ? ORDER BY r.created_at DESC LIMIT 5`, [studentId]),
  ]);

  const totalFees = fees.reduce((s: number, f: any) => s + Number(f.amount), 0);
  const paidFees = fees.reduce((s: number, f: any) => s + Number(f.paid_amount), 0);

  sendSuccess(res, {
    student: { id: studentId, name: studentUser.name, class_name: studentUser.class_name },
    todayAttendance: attendance?.status || 'not_marked',
    fees: { total: totalFees, paid: paidFees, pending: totalFees - paidFees },
    recentResults: exams,
  }, 'Student dashboard retrieved');
});

export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const data = await db.queryOne(`SELECT su.*, s.name, s.email, s.phone, c.name as class_name FROM student_users su LEFT JOIN students s ON su.student_id = s.id LEFT JOIN classes c ON s.class_id = c.id WHERE su.user_id = ?`, [userId]);
  sendSuccess(res, data, 'Profile retrieved');
});

export const getMyAttendanceHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const studentUser = await db.queryOne(`SELECT student_id FROM student_users WHERE user_id = ?`, [userId]);

  const data = await db.query(`SELECT date, status, notes FROM attendance WHERE student_id = ? ORDER BY date DESC LIMIT 60`, [studentUser?.student_id]);

  const stats = { present: 0, absent: 0, late: 0 };
  data.forEach((a: any) => {
    if (a.status === 'present') stats.present++;
    else if (a.status === 'absent') stats.absent++;
    else stats.late++;
  });

  sendSuccess(res, { history: data, stats }, 'Attendance history retrieved');
});

export const getMyFees = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const studentUser = await db.queryOne(`SELECT student_id FROM student_users WHERE user_id = ?`, [userId]);

  const data = await db.query(`SELECT * FROM fees WHERE student_id = ? ORDER BY due_date ASC`, [studentUser?.student_id]);
  sendSuccess(res, data, 'Fees retrieved');
});

export const getMyResults = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const studentUser = await db.queryOne(`SELECT student_id FROM student_users WHERE user_id = ?`, [userId]);

  const data = await db.query(`SELECT r.*, e.name as exam_name, e.subject, e.date, e.max_marks FROM exam_results r LEFT JOIN exams e ON r.exam_id = e.id WHERE r.student_id = ? ORDER BY r.created_at DESC`, [studentUser?.student_id]);
  sendSuccess(res, data, 'Results retrieved');
});

export const getMyTimetable = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const studentUser = await db.queryOne(`SELECT s.class_id FROM student_users su LEFT JOIN students s ON su.student_id = s.id WHERE su.user_id = ?`, [userId]);
  const classId = studentUser?.class_id;
  if (!classId) throw new ApiError(404, 'Class not found');

  const data = await db.query(`SELECT t.*, tc.name as teacher_name FROM timetable t LEFT JOIN teachers tc ON t.teacher_id = tc.id WHERE t.class_id = ? ORDER BY t.day_of_week, t.period_number`, [classId]);
  sendSuccess(res, data, 'Timetable retrieved');
});

export const getLibraryBooks = asyncHandler(async (req: Request, res: Response) => {
  const { search, category } = req.query;
  let sql = `SELECT * FROM library_books WHERE available_copies > 0`;
  const params: any[] = [];

  if (search) { sql += ` AND title LIKE ?`; params.push(`%${search}%`); }
  if (category) { sql += ` AND category = ?`; params.push(category); }
  sql += ` ORDER BY title`;

  const data = await db.query(sql, params);
  sendSuccess(res, data, 'Library books retrieved');
});

export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const data = await db.query(`SELECT * FROM notifications WHERE target_audience IN ('all', 'students') ORDER BY created_at DESC LIMIT 20`);
  sendSuccess(res, data, 'Notifications retrieved');
});
