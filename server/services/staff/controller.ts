import { Request, Response } from 'express';
import { db } from '../config/db';
import { sendSuccess } from '../utils/response';
import { ApiError, asyncHandler } from '../../middleware/error';

export const getStaffDashboard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const today = new Date().toISOString().split('T')[0];
  const dayName = getDayName(new Date());

  const staffUser = await db.queryOne(`SELECT * FROM staff_users WHERE user_id = ?`, [userId]);
  const teacherId = staffUser?.teacher_id;

  const [classes, todaySchedule, attendanceStats] = await Promise.all([
    db.query(`SELECT id, name, grade, section FROM classes WHERE teacher_id = ?`, [teacherId]),
    db.query(`SELECT t.*, c.name as class_name FROM timetable t LEFT JOIN classes c ON t.class_id = c.id WHERE t.teacher_id = ? AND t.day_of_week = ? ORDER BY t.period_number`, [teacherId, dayName]),
    db.query(`SELECT status FROM attendance WHERE date = ?`, [today]),
  ]);

  const attStats = { present: 0, absent: 0, late: 0 };
  attendanceStats.forEach((a: any) => {
    if (a.status === 'present') attStats.present++;
    else if (a.status === 'absent') attStats.absent++;
    else attStats.late++;
  });

  sendSuccess(res, {
    myClasses: classes,
    todaySchedule,
    totalPeriods: todaySchedule.length,
    attendance: attStats,
  }, 'Staff dashboard retrieved');
});

export const getMyClasses = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const staffUser = await db.queryOne(`SELECT teacher_id FROM staff_users WHERE user_id = ?`, [userId]);

  const data = await db.query(`SELECT c.*, (SELECT COUNT(*) FROM students WHERE class_id = c.id) as student_count FROM classes c WHERE c.teacher_id = ?`, [staffUser?.teacher_id]);
  sendSuccess(res, data, 'My classes retrieved');
});

export const getClassStudents = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.params;
  const data = await db.query(`SELECT s.*, c.name as class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.class_id = ? ORDER BY s.name`, [classId]);
  sendSuccess(res, data, 'Students retrieved');
});

export const markAttendanceMultiple = asyncHandler(async (req: Request, res: Response) => {
  const { records } = req.body;
  if (!Array.isArray(records)) throw new ApiError(400, 'records must be an array');

  const today = new Date().toISOString().split('T')[0];
  for (const rec of records) {
    const existing = await db.queryOne(`SELECT id FROM attendance WHERE student_id = ? AND date = ?`, [rec.student_id, today]);
    if (existing) {
      await db.update(`UPDATE attendance SET status = ?, notes = ? WHERE student_id = ? AND date = ?`, [rec.status, rec.notes || '', rec.student_id, today]);
    } else {
      await db.insert(`INSERT INTO attendance (id, student_id, date, status, notes) VALUES (UUID(), ?, ?, ?, ?)`, [rec.student_id, today, rec.status, rec.notes || '']);
    }
  }

  sendSuccess(res, { marked: records.length }, 'Attendance marked successfully', 201);
});

export const getStudentAttendanceHistory = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const data = await db.query(`SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC LIMIT 30`, [studentId]);
  sendSuccess(res, data, 'Attendance history retrieved');
});

export const getMyTimetable = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const staffUser = await db.queryOne(`SELECT teacher_id FROM staff_users WHERE user_id = ?`, [userId]);

  const data = await db.query(`SELECT t.*, c.name as class_name FROM timetable t LEFT JOIN classes c ON t.class_id = c.id WHERE t.teacher_id = ? ORDER BY t.day_of_week, t.period_number`, [staffUser?.teacher_id]);
  sendSuccess(res, data, 'Timetable retrieved');
});

function getDayName(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}
