import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { ApiError, asyncHandler } from '../middleware/error';

export const getStudents = asyncHandler(async (req: Request, res: Response) => {
  const { class_id, status, search } = req.query;
  let query = supabase.from('students').select('*, classes(name)').order('name');

  if (class_id) query = query.eq('class_id', class_id);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw new ApiError(400, error.message);

  const filtered = data?.filter((s: any) =>
    !search || s.name.toLowerCase().includes((search as string).toLowerCase()) ||
    s.roll_number?.toLowerCase().includes((search as string).toLowerCase())
  ) || [];

  sendSuccess(res, filtered, 'Students retrieved');
});

export const getStudentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('students').select('*, classes(name)').eq('id', id).single();
  if (error) throw new ApiError(404, 'Student not found');
  sendSuccess(res, data, 'Student retrieved');
});

export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, parent_name, parent_phone, class_id, dob, gender, address, roll_number, status } = req.body;
  if (!name?.trim()) throw new ApiError(400, 'Name is required');

  const { data, error } = await supabase.from('students').insert({
    name, email, phone, parent_name, parent_phone, class_id: class_id || null,
    dob: dob || null, gender: gender || 'male', address, roll_number, status: status || 'active',
    admission_date: new Date().toISOString().split('T')[0],
  }).select().single();

  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Student created', 201);
});

export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const { data, error } = await supabase.from('students').update(updates).eq('id', id).select().single();
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Student updated');
});

export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from('students').delete().eq('id', id);
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, { id }, 'Student deleted');
});
