import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { sendSuccess } from '../utils/response';
import { ApiError, asyncHandler } from '../../middleware/error';

export const getSystemDashboard = asyncHandler(async (req: Request, res: Response) => {
  const [userStats, schoolStats, recentLogins] = await Promise.all([
    supabase.from('users').select('role, is_active'),
    supabase.from('students').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('email, last_login').order('last_login', { ascending: false }).limit(10),
  ]);

  const users = userStats.data || [];
  const byRole = {
    super_admin: users.filter(u => u.role === 'super_admin').length,
    admin: users.filter(u => u.role === 'admin').length,
    staff: users.filter(u => u.role === 'staff').length,
    student: users.filter(u => u.role === 'student').length,
    parent: users.filter(u => u.role === 'parent').length,
  };

  sendSuccess(res, {
    users: { total: users.length, active: users.filter(u => u.is_active).length, byRole },
    school: { totalStudents: schoolStats.count || 0 },
    recentLogins: recentLogins.data,
  }, 'System dashboard retrieved');
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role, status } = req.query;
  let query = supabase.from('users').select('*, user_profiles(name, phone, avatar_url), admin_users(*), staff_users(*), student_users(*), parent_users(*)').order('created_at', { ascending: false });

  if (role) query = query.eq('role', role);
  if (status === 'active') query = query.eq('is_active', true);
  if (status === 'inactive') query = query.eq('is_active', false);

  const { data, error } = await query;
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Users retrieved');
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, role, name, phone } = req.body;
  if (!email || !password || !role || !name) throw new ApiError(400, 'Email, password, role, and name are required');

  const { data: user, error: userError } = await supabase.from('users').insert({
    email, password_hash: password, role, is_active: true, is_verified: true,
  }).select().single();

  if (userError) throw new ApiError(400, userError.message);

  const { error: profileError } = await supabase.from('user_profiles').insert({
    user_id: user.id, name, phone: phone || '',
  });

  if (profileError) throw new ApiError(400, profileError.message);

  sendSuccess(res, user, 'User created', 201);
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { role, is_active, is_verified } = req.body;

  const { data, error } = await supabase.from('users').update({ role, is_active, is_verified }).eq('id', userId).select().single();
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'User updated');
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, { id: userId }, 'User deleted');
});

export const getPermissions = asyncHandler(async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('permissions').select('*').order('role');
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Permissions retrieved');
});

export const updatePermission = asyncHandler(async (req: Request, res: Response) => {
  const { permissionId } = req.params;
  const { allowed } = req.body;

  const { data, error } = await supabase.from('permissions').update({ allowed }).eq('id', permissionId).select().single();
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, data, 'Permission updated');
});

export const resetUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { newPassword } = req.body;
  if (!newPassword) throw new ApiError(400, 'New password is required');

  const { error } = await supabase.from('users').update({ password_hash: newPassword }).eq('id', userId);
  if (error) throw new ApiError(400, error.message);
  sendSuccess(res, {}, 'Password reset successfully');
});
