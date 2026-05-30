import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { sendSuccess } from '../utils/response';
import { ApiError, asyncHandler } from '../middleware/error';

export const getClasses = asyncHandler(async (req: Request, res: Response) => {
  const { grade, section } = req.query;
  let query = supabase.from('classes').select('*, teachers(name, subject)').order('grade');

  if (grade) query = query.eq('grade', grade);
  if (section) query = query.eq('section', section);

  const { data, error } = await query;
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Classes retrieved');
});

export const getClassById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('classes').select('*, teachers(name, subject)').eq('id', id).single();
  if (error) throw new ApiError(404, 'Class not found');
  sendSuccess(res, data, 'Class retrieved');
});

export const createClass = asyncHandler(async (req: Request, res: Response) => {
  const { name, grade, section, capacity, teacher_id } = req.body;
  if (!name?.trim() || !grade) throw new ApiError(400, 'name and grade are required');

  const { data, error } = await supabase.from('classes').insert({
    name, grade, section: section || 'A', capacity: capacity || 40,
    teacher_id: teacher_id || null,
  }).select().single();

  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Class created', 201);
});

export const updateClass = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('classes').update(req.body).eq('id', id).select().single();
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Class updated');
});

export const deleteClass = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from('classes').delete().eq('id', id);
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, { id }, 'Class deleted');
});

export const getClassStudents = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('students').select('*').eq('class_id', id).order('name');
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Class students retrieved');
});
