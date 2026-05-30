import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { sendSuccess } from '../utils/response';
import { ApiError, asyncHandler } from '../middleware/error';

export const getExams = asyncHandler(async (req: Request, res: Response) => {
  const { class_id, subject, from_date, to_date } = req.query;
  let query = supabase.from('exams').select('*, classes(name)').order('date', { ascending: true });

  if (class_id) query = query.eq('class_id', class_id);
  if (subject) query = query.eq('subject', subject);
  if (from_date) query = query.gte('date', from_date);
  if (to_date) query = query.lte('date', to_date);

  const { data, error } = await query;
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Exams retrieved');
});

export const getExamById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('exams').select('*, classes(name)').eq('id', id).single();
  if (error) throw new ApiError(404, 'Exam not found');
  sendSuccess(res, data, 'Exam retrieved');
});

export const createExam = asyncHandler(async (req: Request, res: Response) => {
  const { name, class_id, subject, date, max_marks, duration_minutes } = req.body;
  if (!name?.trim() || !subject || !date) throw new ApiError(400, 'name, subject, and date are required');

  const { data, error } = await supabase.from('exams').insert({
    name, class_id: class_id || null, subject, date,
    max_marks: max_marks || 100, duration_minutes: duration_minutes || 60,
  }).select().single();

  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Exam created', 201);
});

export const updateExam = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('exams').update(req.body).eq('id', id).select().single();
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Exam updated');
});

export const deleteExam = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from('exams').delete().eq('id', id);
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, { id }, 'Exam deleted');
});

export const recordExamResult = asyncHandler(async (req: Request, res: Response) => {
  const { exam_id, student_id, marks_obtained, grade, remarks } = req.body;
  if (!exam_id || !student_id || marks_obtained === undefined) throw new ApiError(400, 'exam_id, student_id, and marks_obtained are required');

  const { data, error } = await supabase.from('exam_results').upsert(
    { exam_id, student_id, marks_obtained, grade: grade || '', remarks: remarks || '' },
    { onConflict: 'exam_id,student_id' }
  ).select().single();

  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Exam result recorded', 201);
});

export const getExamResults = asyncHandler(async (req: Request, res: Response) => {
  const { exam_id, student_id } = req.query;
  let query = supabase.from('exam_results').select('*, students(name), exams(name, max_marks)').order('marks_obtained', { ascending: false });

  if (exam_id) query = query.eq('exam_id', exam_id);
  if (student_id) query = query.eq('student_id', student_id);

  const { data, error } = await query;
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Exam results retrieved');
});
