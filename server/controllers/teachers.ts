import { Request, Response } from 'express';
import { db } from '../config/db';
import { sendSuccess } from '../utils/response';
import { ApiError, asyncHandler } from '../middleware/error';

export const getTeachers = asyncHandler(async (req: Request, res: Response) => {
  const { status, subject, search } = req.query;
  let sql = `SELECT * FROM teachers WHERE 1=1`;
  const params: any[] = [];

  if (status) { sql += ` AND status = ?`; params.push(status); }
  if (subject) { sql += ` AND subject = ?`; params.push(subject); }
  if (search) { sql += ` AND (name LIKE ? OR subject LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
  sql += ` ORDER BY name`;

  const data = await db.query(sql, params);
  sendSuccess(res, data, 'Teachers retrieved');
});

export const getTeacherById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const teacher = await db.queryOne(`SELECT * FROM teachers WHERE id = ?`, [id]);
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  sendSuccess(res, teacher, 'Teacher retrieved');
});

export const createTeacher = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, subject, qualification, join_date, status } = req.body;
  if (!name?.trim() || !email?.trim()) throw new ApiError(400, 'Name and email are required');

  await db.insert(
    `INSERT INTO teachers (id, name, email, phone, subject, qualification, join_date, status)
     VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
    [name, email, phone || '', subject || '', qualification || '', join_date || new Date().toISOString().split('T')[0], status || 'active']
  );

  const teacher = await db.queryOne(`SELECT * FROM teachers WHERE id = LAST_INSERT_ID()`);
  sendSuccess(res, teacher, 'Teacher created', 201);
});

export const updateTeacher = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const fields = req.body;
  const updates = Object.keys(fields).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(fields), id];

  await db.update(`UPDATE teachers SET ${updates} WHERE id = ?`, values);
  const teacher = await db.queryOne(`SELECT * FROM teachers WHERE id = ?`, [id]);
  sendSuccess(res, teacher, 'Teacher updated');
});

export const deleteTeacher = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await db.delete(`DELETE FROM teachers WHERE id = ?`, [id]);
  sendSuccess(res, { id }, 'Teacher deleted');
});
