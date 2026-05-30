import { Request, Response } from 'express';
import { db } from '../config/db';
import { sendSuccess } from '../utils/response';
import { ApiError, asyncHandler } from '../middleware/error';

export const getAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { student_id, date, class_id } = req.query;
  let sql = `SELECT a.*, s.name as student_name, s.class_id, c.name as class_name
             FROM attendance a
             LEFT JOIN students s ON a.student_id = s.id
             LEFT JOIN classes c ON s.class_id = c.id
             WHERE 1=1`;
  const params: any[] = [];

  if (student_id) { sql += ` AND a.student_id = ?`; params.push(student_id); }
  if (date) { sql += ` AND a.date = ?`; params.push(date); }
  sql += ` ORDER BY a.date DESC`;

  let data = await db.query(sql, params);
  if (class_id) { data = data.filter((a: any) => a.class_id === class_id); }

  sendSuccess(res, data, 'Attendance records retrieved');
});

export const recordAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { student_id, date, status, notes } = req.body;
  if (!student_id || !date || !status) throw new ApiError(400, 'student_id, date, and status are required');

  const existing = await db.queryOne(`SELECT id FROM attendance WHERE student_id = ? AND date = ?`, [student_id, date]);

  if (existing) {
    await db.update(`UPDATE attendance SET status = ?, notes = ? WHERE student_id = ? AND date = ?`, [status, notes || '', student_id, date]);
  } else {
    await db.insert(`INSERT INTO attendance (id, student_id, date, status, notes) VALUES (UUID(), ?, ?, ?, ?)`, [student_id, date, status, notes || '']);
  }

  const record = await db.queryOne(`SELECT * FROM attendance WHERE student_id = ? AND date = ?`, [student_id, date]);
  sendSuccess(res, record, 'Attendance recorded', 201);
});

export const getAttendanceStats = asyncHandler(async (req: Request, res: Response) => {
  const { student_id, start_date, end_date } = req.query;
  let sql = `SELECT status FROM attendance WHERE 1=1`;
  const params: any[] = [];

  if (student_id) { sql += ` AND student_id = ?`; params.push(student_id); }
  if (start_date) { sql += ` AND date >= ?`; params.push(start_date); }
  if (end_date) { sql += ` AND date <= ?`; params.push(end_date); }

  const data = await db.query(sql, params);

  const stats = {
    total: data.length,
    present: data.filter((d: any) => d.status === 'present').length,
    absent: data.filter((d: any) => d.status === 'absent').length,
    late: data.filter((d: any) => d.status === 'late').length,
    percentage: 0,
  };
  stats.percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  sendSuccess(res, stats, 'Attendance statistics retrieved');
});

export const bulkRecordAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { records } = req.body;
  if (!Array.isArray(records)) throw new ApiError(400, 'records must be an array');

  for (const rec of records) {
    const existing = await db.queryOne(`SELECT id FROM attendance WHERE student_id = ? AND date = ?`, [rec.student_id, rec.date]);
    if (existing) {
      await db.update(`UPDATE attendance SET status = ?, notes = ? WHERE student_id = ? AND date = ?`, [rec.status, rec.notes || '', rec.student_id, rec.date]);
    } else {
      await db.insert(`INSERT INTO attendance (id, student_id, date, status, notes) VALUES (UUID(), ?, ?, ?, ?)`, [rec.student_id, rec.date, rec.status, rec.notes || '']);
    }
  }

  sendSuccess(res, { count: records.length }, 'Attendance recorded in bulk', 201);
});
