import { Request, Response } from 'express';
import { db } from '../config/db';
import { sendSuccess } from '../utils/response';
import { ApiError, asyncHandler } from '../middleware/error';

export const getClasses = asyncHandler(async (req: Request, res: Response) => {
  const { grade, section } = req.query;
  let sql = `SELECT c.*, t.name as teacher_name, t.subject FROM classes c LEFT JOIN teachers t ON c.teacher_id = t.id WHERE 1=1`;
  const params: any[] = [];

  if (grade) { sql += ` AND c.grade = ?`; params.push(grade); }
  if (section) { sql += ` AND c.section = ?`; params.push(section); }
  sql += ` ORDER BY c.grade, c.section`;

  const data = await db.query(sql, params);
  sendSuccess(res, data, 'Classes retrieved');
});

export const getClassById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const cls = await db.queryOne(`SELECT c.*, t.name as teacher_name FROM classes c LEFT JOIN teachers t ON c.teacher_id = t.id WHERE c.id = ?`, [id]);
  if (!cls) throw new ApiError(404, 'Class not found');
  sendSuccess(res, cls, 'Class retrieved');
});

export const createClass = asyncHandler(async (req: Request, res: Response) => {
  const { name, grade, section, capacity, teacher_id } = req.body;
  if (!name?.trim() || !grade) throw new ApiError(400, 'name and grade are required');

  await db.insert(
    `INSERT INTO classes (id, name, grade, section, capacity, teacher_id) VALUES (UUID(), ?, ?, ?, ?, ?)`,
    [name, grade, section || 'A', capacity || 40, teacher_id || null]
  );

  const cls = await db.queryOne(`SELECT * FROM classes WHERE id = LAST_INSERT_ID()`);
  sendSuccess(res, cls, 'Class created', 201);
});

export const updateClass = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const fields = req.body;
  const updates = Object.keys(fields).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(fields), id];

  await db.update(`UPDATE classes SET ${updates} WHERE id = ?`, values);
  const cls = await db.queryOne(`SELECT * FROM classes WHERE id = ?`, [id]);
  sendSuccess(res, cls, 'Class updated');
});

export const deleteClass = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await db.delete(`DELETE FROM classes WHERE id = ?`, [id]);
  sendSuccess(res, { id }, 'Class deleted');
});

export const getClassStudents = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await db.query(`SELECT * FROM students WHERE class_id = ? ORDER BY name`, [id]);
  sendSuccess(res, data, 'Class students retrieved');
});
