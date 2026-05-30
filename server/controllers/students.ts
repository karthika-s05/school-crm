import { Request, Response } from 'express';
import { db } from '../config/db';
import { sendSuccess } from '../utils/response';
import { ApiError, asyncHandler } from '../middleware/error';

export const getStudents = asyncHandler(async (req: Request, res: Response) => {
  const { class_id, status, search } = req.query;
  let sql = `SELECT s.*, c.name as class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE 1=1`;
  const params: any[] = [];

  if (class_id) { sql += ` AND s.class_id = ?`; params.push(class_id); }
  if (status) { sql += ` AND s.status = ?`; params.push(status); }
  if (search) { sql += ` AND (s.name LIKE ? OR s.roll_number LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
  sql += ` ORDER BY s.name`;

  const data = await db.query(sql, params);
  sendSuccess(res, data, 'Students retrieved');
});

export const getStudentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const student = await db.queryOne(`SELECT s.*, c.name as class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.id = ?`, [id]);
  if (!student) throw new ApiError(404, 'Student not found');
  sendSuccess(res, student, 'Student retrieved');
});

export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, parent_name, parent_phone, class_id, dob, gender, address, roll_number, status } = req.body;
  if (!name?.trim()) throw new ApiError(400, 'Name is required');

  const result = await db.insert(
    `INSERT INTO students (id, name, email, phone, parent_name, parent_phone, class_id, dob, gender, address, roll_number, status, admission_date)
     VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
    [name, email || null, phone || null, parent_name || null, parent_phone || null, class_id || null, dob || null, gender || 'male', address || null, roll_number || null, status || 'active']
  );

  const student = await db.queryOne(`SELECT * FROM students WHERE id = LAST_INSERT_ID()`);
  sendSuccess(res, student, 'Student created', 201);
});

export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const fields = req.body;
  const updates = Object.keys(fields).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(fields), id];

  await db.update(`UPDATE students SET ${updates} WHERE id = ?`, values);
  const student = await db.queryOne(`SELECT * FROM students WHERE id = ?`, [id]);
  sendSuccess(res, student, 'Student updated');
});

export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await db.delete(`DELETE FROM students WHERE id = ?`, [id]);
  sendSuccess(res, { id }, 'Student deleted');
});
