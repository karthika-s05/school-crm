import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { sendSuccess } from '../utils/response';
import { ApiError, asyncHandler } from '../middleware/error';

export const getFees = asyncHandler(async (req: Request, res: Response) => {
  const { student_id, status, academic_year } = req.query;
  let query = supabase.from('fees').select('*, students(name, roll_number, classes(name))').order('due_date', { ascending: false });

  if (student_id) query = query.eq('student_id', student_id);
  if (status) query = query.eq('status', status);
  if (academic_year) query = query.eq('academic_year', academic_year);

  const { data, error } = await query;
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Fees retrieved');
});

export const getFeeById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('fees').select('*, students(name)').eq('id', id).single();
  if (error) throw new ApiError(404, 'Fee record not found');
  sendSuccess(res, data, 'Fee record retrieved');
});

export const createFee = asyncHandler(async (req: Request, res: Response) => {
  const { student_id, amount, paid_amount, due_date, fee_type, academic_year } = req.body;
  if (!student_id || !amount || !due_date) throw new ApiError(400, 'student_id, amount, and due_date are required');

  const paidAmt = paid_amount || 0;
  const status = paidAmt >= amount ? 'paid' : paidAmt > 0 ? 'partial' : 'pending';

  const { data, error } = await supabase.from('fees').insert({
    student_id, amount, paid_amount: paidAmt, due_date, fee_type: fee_type || 'tuition',
    status, academic_year: academic_year || '2025-26', paid_date: status === 'paid' ? new Date().toISOString().split('T')[0] : null,
  }).select().single();

  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Fee record created', 201);
});

export const updateFee = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { paid_amount, amount } = req.body;

  let updates = { ...req.body };
  if (paid_amount !== undefined && amount !== undefined) {
    updates.status = paid_amount >= amount ? 'paid' : paid_amount > 0 ? 'partial' : 'pending';
    updates.paid_date = updates.status === 'paid' ? new Date().toISOString().split('T')[0] : null;
  }

  const { data, error } = await supabase.from('fees').update(updates).eq('id', id).select().single();
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Fee record updated');
});

export const getFeeStats = asyncHandler(async (req: Request, res: Response) => {
  const { academic_year } = req.query;
  let query = supabase.from('fees').select('amount, paid_amount, status');
  if (academic_year) query = query.eq('academic_year', academic_year);

  const { data, error } = await query;
  if (error) throw new ApiError(400, error.message);

  const stats = {
    total_amount: data?.reduce((s: number, f: any) => s + Number(f.amount), 0) || 0,
    total_paid: data?.reduce((s: number, f: any) => s + Number(f.paid_amount), 0) || 0,
    total_pending: 0,
    paid_count: 0,
    pending_count: 0,
    partial_count: 0,
  };

  data?.forEach((f: any) => {
    const balance = Number(f.amount) - Number(f.paid_amount);
    stats.total_pending += balance;
    if (f.status === 'paid') stats.paid_count++;
    else if (f.status === 'pending') stats.pending_count++;
    else stats.partial_count++;
  });

  sendSuccess(res, stats, 'Fee statistics retrieved');
});
