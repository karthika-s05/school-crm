import { Request, Response } from 'express';
import { db } from '../config/db';
import { sendSuccess } from '../utils/response';
import { ApiError, asyncHandler } from '../middleware/error';

export const getTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { class_id, day_of_week } = req.query;
  let sql = `SELECT t.*, c.name as class_name, tc.name as teacher_name, tc.subject
             FROM timetable t
             LEFT JOIN classes c ON t.class_id = c.id
             LEFT JOIN teachers tc ON t.teacher_id = tc.id
             WHERE 1=1`;
  const params: any[] = [];

  if (class_id) { sql += ` AND t.class_id = ?`; params.push(class_id); }
  if (day_of_week) { sql += ` AND t.day_of_week = ?`; params.push(day_of_week); }
  sql += ` ORDER BY t.period_number`;

  const data = await db.query(sql, params);
  sendSuccess(res, data, 'Timetable entries retrieved');
});

export const addTimetableEntry = asyncHandler(async (req: Request, res: Response) => {
  const { class_id, day_of_week, period_number, subject, teacher_id, start_time, end_time } = req.body;
  if (!class_id || !day_of_week || !period_number || !subject) {
    throw new ApiError(400, 'class_id, day_of_week, period_number, and subject are required');
  }

  await db.insert(
    `INSERT INTO timetable (id, class_id, day_of_week, period_number, subject, teacher_id, start_time, end_time)
     VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
    [class_id, day_of_week, period_number, subject, teacher_id || null, start_time || '08:00', end_time || '08:45']
  );

  const entry = await db.queryOne(`SELECT * FROM timetable WHERE id = LAST_INSERT_ID()`);
  sendSuccess(res, entry, 'Timetable entry created', 201);
});

export const updateTimetableEntry = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const fields = req.body;
  const updates = Object.keys(fields).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(fields), id];

  await db.update(`UPDATE timetable SET ${updates} WHERE id = ?`, values);
  const entry = await db.queryOne(`SELECT * FROM timetable WHERE id = ?`, [id]);
  sendSuccess(res, entry, 'Timetable entry updated');
});

export const deleteTimetableEntry = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await db.delete(`DELETE FROM timetable WHERE id = ?`, [id]);
  sendSuccess(res, { id }, 'Timetable entry deleted');
});

export const getClassTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.params;
  const data = await db.query(
    `SELECT t.*, tc.name as teacher_name FROM timetable t LEFT JOIN teachers tc ON t.teacher_id = tc.id WHERE t.class_id = ? ORDER BY t.day_of_week, t.period_number`,
    [classId]
  );

  const grouped: Record<string, any[]> = {
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: []
  };
  data.forEach((entry: any) => {
    if (grouped[entry.day_of_week]) grouped[entry.day_of_week].push(entry);
  });

  sendSuccess(res, grouped, 'Class timetable retrieved');
});
