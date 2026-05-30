import { Request, Response } from 'express';
import { db } from '../config/db';
import { sendSuccess } from '../utils/response';
import { ApiError, asyncHandler } from '../middleware/error';

export const getFees = asyncHandler(async (req: Request, res: Response) => {
  const { student_id, status, academic_year } = req.query;
  let sql = `SELECT f.*, s.name as student_name, s.roll_number, c.name as class_name
             FROM fees f
             LEFT JOIN students s ON f.student_id = s.id
             LEFT JOIN classes c ON s.class_id = c.id
             WHERE 1=1`;
  const params: any[] = [];

  if (student_id) { sql += ` AND f.student_id = ?`; params.push(student_id); }
  if (status) { sql += ` AND f.status = ?`; params.push(status); }
  if (academic_year) { sql += ` AND f.academic_year = ?`; params.push(academic_year); }
  sql += ` ORDER BY f.due_date DESC`;

  const data = await db.query(sql, params);
  sendSuccess(res, data, 'Fees retrieved');
});

export const getFeeById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const fee = await db.queryOne(`SELECT f.*, s.name as student_name FROM fees f LEFT JOIN students s ON f.student_id = s.id WHERE f.id = ?`, [id]);
  if (!fee) throw new ApiError(404, 'Fee record not found');
  sendSuccess(res, fee, 'Fee record retrieved');
});

export const createFee = asyncHandler(async (req: Request, res: Response) => {
  const { student_id, amount, paid_amount, due_date, fee_type, academic_year } = req.body;
  if (!student_id || !amount || !due_date) throw new ApiError(400, 'student_id, amount, and due_date are required');

  const paidAmt = paid_amount || 0;
  const status = paidAmt >= amount ? 'paid' : paidAmt > 0 ? 'partial' : 'pending';
  const paidDate = status === 'paid' ? new Date().toISOString().split('T')[0] : null;

  await db.insert(
    `INSERT INTO fees (id, student_id, amount, paid_amount, due_date, fee_type, status, academic_year, paid_date)
     VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)`,
    [student_id, amount, paidAmt, due_date, fee_type || 'tuition', status, academic_year || '2025-26', paidDate]
  );

  const fee = await db.queryOne(`SELECT * FROM fees WHERE id = LAST_INSERT_ID()`);
  sendSuccess(res, fee, 'Fee record created', 201);
});

export const updateFee = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { paid_amount, amount, ...rest } = req.body;

  let status = rest.status;
  let paidDate = rest.paid_date;
  if (paid_amount !== undefined && amount !== undefined) {
    status = paid_amount >= amount ? 'paid' : paid_amount > 0 ? 'partial' : 'pending';
    paidDate = status === 'paid' ? new Date().toISOString().split('T')[0] : null;
  }

  const fields = { ...rest, paid_amount, status, paid_date: paidDate };
  const updates = Object.entries(fields).filter(([k, v]) => v !== undefined).map(([k, v]) => `${k} = ?`).join(', ');
  const values = [...Object.entries(fields).filter(([k, v]) => v !== undefined).map(([k, v]) => v), id];

  await db.update(`UPDATE fees SET ${updates} WHERE id = ?`, values);
  const fee = await db.queryOne(`SELECT * FROM fees WHERE id = ?`, [id]);
  sendSuccess(res, fee, 'Fee record updated');
});

export const getFeeStats = asyncHandler(async (req: Request, res: Response) => {
  const { academic_year } = req.query;
  let sql = `SELECT amount, paid_amount, status FROM fees WHERE 1=1`;
  const params: any[] = [];
  if (academic_year) { sql += ` AND academic_year = ?`; params.push(academic_year); }

  const data = await db.query(sql, params);

  const stats = {
    total_amount: data.reduce((s: number, f: any) => s + Number(f.amount), 0),
    total_paid: data.reduce((s: number, f: any) => s + Number(f.paid_amount), 0),
    total_pending: 0,
    paid_count: 0,
    pending_count: 0,
    partial_count: 0,
  };

  data.forEach((f: any) => {
    stats.total_pending += Number(f.amount) - Number(f.paid_amount);
    if (f.status === 'paid') stats.paid_count++;
    else if (f.status === 'pending') stats.pending_count++;
    else stats.partial_count++;
  });

  sendSuccess(res, stats, 'Fee statistics retrieved');
});
