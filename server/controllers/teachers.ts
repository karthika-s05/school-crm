import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { ApiError, asyncHandler } from '../middleware/error';

export const getTeachers = asyncHandler(async (req: Request, res: Response) => {
  const { status, subject, search } = req.query;
  let query = supabase.from('teachers').select('*').order('name');

  if (status) query = query.eq('status', status);
  if (subject) query = query.eq('subject', subject);

  const { data, error } = await query;
  if (error) throw new ApiError(400, error.message);

  const filtered = data?.filter((t: any) =>
    !search || t.name.toLowerCase().includes((search as string).toLowerCase()) ||
    t.subject.toLowerCase().includes((search as string).toLowerCase())
  ) || [];

  sendSuccess(res, filtered, 'Teachers retrieved');
});

export const getTeacherById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('teachers').select('*').eq('id', id).single();
  if (error) throw new ApiError(404, 'Teacher not found');
  sendSuccess(res, data, 'Teacher retrieved');
});

export const createTeacher = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, subject, qualification, join_date, status } = req.body;
  if (!name?.trim() || !email?.trim()) throw new ApiError(400, 'Name and email are required');

  const { data, error } = await supabase.from('teachers').insert({
    name, email, phone: phone || '', subject, qualification: qualification || '',
    join_date: join_date || new Date().toISOString().split('T')[0], status: status || 'active',
  }).select().single();

  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Teacher created', 201);
});

export const updateTeacher = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('teachers').update(req.body).eq('id', id).select().single();
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Teacher updated');
});

export const deleteTeacher = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from('teachers').delete().eq('id', id);
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, { id }, 'Teacher deleted');
});
