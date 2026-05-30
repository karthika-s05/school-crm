import { Request, Response } from 'express';
import { db } from '../config/db';
import { sendSuccess } from '../utils/response';
import { ApiError, asyncHandler } from '../middleware/error';

export const getExams = asyncHandler(async (req: Request, res: Response) => {
  const { class_id, subject, from_date, to_date } = req.query;
  let sql = `SELECT e.*, c.name as class_name FROM exams e LEFT JOIN classes c ON e.class_id = c.id WHERE 1=1`;
  const params: any[] = [];

  if (class_id) { sql += ` AND e.class_id = ?`; params.push(class_id); }
  if (subject) { sql += ` AND e.subject = ?`; params.push(subject); }
  if (from_date) { sql += ` AND e.date >= ?`; params.push(from_date); }
  if (to_date) { sql += ` AND e.date <= ?`; params.push(to_date); }
  sql += ` ORDER BY e.date ASC`;

  const data = await db.query(sql, params);
  sendSuccess(res, data, 'Exams retrieved');
});

export const getExamById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const exam = await db.queryOne(`SELECT e.*, c.name as class_name FROM exams e LEFT JOIN classes c ON e.class_id = c.id WHERE e.id = ?`, [id]);
  if (!exam) throw new ApiError(404, 'Exam not found');
  sendSuccess(res, exam, 'Exam retrieved');
});

export const createExam = asyncHandler(async (req: Request, res: Response) => {
  const { name, class_id, subject, date, max_marks, duration_minutes } = req.body;
  if (!name?.trim() || !subject || !date) throw new ApiError(400, 'name, subject, and date are required');

  await db.insert(
    `INSERT INTO exams (id, name, class_id, subject, date, max_marks, duration_minutes) VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
    [name, class_id || null, subject, date, max_marks || 100, duration_minutes || 60]
  );

  const exam = await db.queryOne(`SELECT * FROM exams WHERE id = LAST_INSERT_ID()`);
  sendSuccess(res, exam, 'Exam created', 201);
});

export const updateExam = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const fields = req.body;
  const updates = Object.keys(fields).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(fields), id];

  await db.update(`UPDATE exams SET ${updates} WHERE id = ?`, values);
  const exam = await db.queryOne(`SELECT * FROM exams WHERE id = ?`, [id]);
  sendSuccess(res, exam, 'Exam updated');
});

export const deleteExam = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await db.delete(`DELETE FROM exams WHERE id = ?`, [id]);
  sendSuccess(res, { id }, 'Exam deleted');
});

export const recordExamResult = asyncHandler(async (req: Request, res: Response) => {
  const { exam_id, student_id, marks_obtained, grade, remarks } = req.body;
  if (!exam_id || !student_id || marks_obtained === undefined) throw new ApiError(400, 'exam_id, student_id, and marks_obtained are required');

  const existing = await db.queryOne(`SELECT id FROM exam_results WHERE exam_id = ? AND student_id = ?`, [exam_id, student_id]);

  if (existing) {
    await db.update(`UPDATE exam_results SET marks_obtained = ?, grade = ?, remarks = ? WHERE exam_id = ? AND student_id = ?`, [marks_obtained, grade || '', remarks || '', exam_id, student_id]);
  } else {
    await db.insert(`INSERT INTO exam_results (id, exam_id, student_id, marks_obtained, grade, remarks) VALUES (UUID(), ?, ?, ?, ?, ?)`, [exam_id, student_id, marks_obtained, grade || '', remarks || '']);
  }

  const result = await db.queryOne(`SELECT * FROM exam_results WHERE exam_id = ? AND student_id = ?`, [exam_id, student_id]);
  sendSuccess(res, result, 'Exam result recorded', 201);
});

export const getExamResults = asyncHandler(async (req: Request, res: Response) => {
  const { exam_id, student_id } = req.query;
  let sql = `SELECT r.*, s.name as student_name, e.name as exam_name, e.max_marks
             FROM exam_results r
             LEFT JOIN students s ON r.student_id = s.id
             LEFT JOIN exams e ON r.exam_id = e.id
             WHERE 1=1`;
  const params: any[] = [];

  if (exam_id) { sql += ` AND r.exam_id = ?`; params.push(exam_id); }
  if (student_id) { sql += ` AND r.student_id = ?`; params.push(student_id); }
  sql += ` ORDER BY r.marks_obtained DESC`;

  const data = await db.query(sql, params);
  sendSuccess(res, data, 'Exam results retrieved');
});
