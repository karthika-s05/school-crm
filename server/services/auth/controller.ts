import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { ApiError, asyncHandler } from '../../middleware/error';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const { data: user, error } = await supabase
    .from('users')
    .select('*, user_profiles(*)')
    .eq('email', email)
    .eq('password_hash', password)
    .single();

  if (error || !user) throw new ApiError(401, 'Invalid credentials');
  if (!user.is_active) throw new ApiError(403, 'Account is deactivated');

  // Update last login
  await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);

  // Get role-specific data
  let roleData = null;
  if (user.role === 'admin') {
    const { data } = await supabase.from('admin_users').select('*').eq('user_id', user.id).single();
    roleData = data;
  } else if (user.role === 'staff') {
    const { data } = await supabase.from('staff_users').select('*, teachers(*)').eq('user_id', user.id).single();
    roleData = data;
  } else if (user.role === 'student') {
    const { data } = await supabase.from('student_users').select('*, students(*, classes(name))').eq('user_id', user.id).single();
    roleData = data;
  } else if (user.role === 'parent') {
    const { data } = await supabase.from('parent_users').select('*, parent_children(students(*, classes(name)), relationship)').eq('user_id', user.id).single();
    roleData = data;
  }

  sendSuccess(res, {
    user: { id: user.id, email: user.email, role: user.role, profile: user.user_profiles },
    roleData,
  }, 'Login successful');
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, role, phone, gender } = req.body;
  if (!email || !password || !name || !role) throw new ApiError(400, 'Email, password, name, and role are required');

  const validRoles = ['admin', 'staff', 'student', 'parent'];
  if (!validRoles.includes(role)) throw new ApiError(400, 'Invalid role');

  // Create user
  const { data: user, error: userError } = await supabase.from('users').insert({
    email, password_hash: password, role, is_active: true, is_verified: false,
  }).select().single();

  if (userError) throw new ApiError(400, userError.message);

  // Create profile
  await supabase.from('user_profiles').insert({
    user_id: user.id, name, phone: phone || '', gender: gender || 'male',
  });

  sendSuccess(res, { id: user.id, email: user.email, role: user.role }, 'Registration successful', 201);
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { data: user, error } = await supabase
    .from('users')
    .select('*, user_profiles(*)')
    .eq('id', userId)
    .single();

  if (error || !user) throw new ApiError(404, 'User not found');

  sendSuccess(res, user, 'Profile retrieved');
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { name, phone, address, avatar_url } = req.body;

  const { data, error } = await supabase
    .from('user_profiles')
    .update({ name, phone, address, avatar_url })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Profile updated');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { currentPassword, newPassword } = req.body;

  const { data: user } = await supabase.from('users').select('password_hash').eq('id', userId).single();
  if (!user || user.password_hash !== currentPassword) throw new ApiError(401, 'Current password is incorrect');

  const { error } = await supabase.from('users').update({ password_hash: newPassword }).eq('id', userId);
  if (error) throw new ApiError(400, error.message);

  sendSuccess(res, {}, 'Password changed successfully');
});

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.query;
  let query = supabase.from('users').select('*, user_profiles(*)').order('created_at', { ascending: false });
  if (role) query = query.eq('role', role);

  const { data, error } = await query;
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Users retrieved');
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { is_active, is_verified } = req.body;

  const { data, error } = await supabase.from('users').update({ is_active, is_verified }).eq('id', userId).select().single();
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'User status updated');
});
