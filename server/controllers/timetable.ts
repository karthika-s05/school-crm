import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { sendSuccess } from '../utils/response';
import { ApiError, asyncHandler } from '../middleware/error';

export const getTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { class_id, day_of_week } = req.query;
  let query = supabase.from('timetable').select('*, classes(name), teachers(name, subject)').order('period_number');

  if (class_id) query = query.eq('class_id', class_id);
  if (day_of_week) query = query.eq('day_of_week', day_of_week);

  const { data, error } = await query;
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Timetable entries retrieved');
});

export const addTimetableEntry = asyncHandler(async (req: Request, res: Response) => {
  const { class_id, day_of_week, period_number, subject, teacher_id, start_time, end_time } = req.body;
  if (!class_id || !day_of_week || !period_number || !subject) {
    throw new ApiError(400, 'class_id, day_of_week, period_number, and subject are required');
  }

  const { data, error } = await supabase.from('timetable').insert({
    class_id, day_of_week, period_number, subject, teacher_id: teacher_id || null,
    start_time: start_time || '08:00', end_time: end_time || '08:45',
  }).select().single();

  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Timetable entry created', 201);
});

export const updateTimetableEntry = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('timetable').update(req.body).eq('id', id).select().single();
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Timetable entry updated');
});

export const deleteTimetableEntry = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from('timetable').delete().eq('id', id);
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, { id }, 'Timetable entry deleted');
});

export const getClassTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.params;
  const { data, error } = await supabase.from('timetable')
    .select('*, teachers(name)')
    .eq('class_id', classId)
    .order('day_of_week')
    .order('period_number');

  if (error) throw new ApiError(400, error.message);

  const grouped = {
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: []
  };
  data?.forEach((entry: any) => {
    if (grouped[entry.day_of_week as keyof typeof grouped]) {
      grouped[entry.day_of_week as keyof typeof grouped].push(entry);
    }
  });

  sendSuccess(res, grouped, 'Class timetable retrieved');
});
