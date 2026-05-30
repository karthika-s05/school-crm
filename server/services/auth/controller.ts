import { Request, Response } from 'express';
import { db } from '../config/db';
import { sendSuccess } from '../utils/response';
import { ApiError, asyncHandler } from '../../middleware/error';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await db.queryOne(`SELECT * FROM users WHERE email = ? AND password_hash = ?`, [email, password]);
  if (!user) throw new ApiError(401, 'Invalid credentials');
  if (!user.is_active) throw new ApiError(403, 'Account is deactivated');

  await db.update(`UPDATE users SET last_login = NOW() WHERE id = ?`, [user.id]);

  const profile = await db.queryOne(`SELECT * FROM user_profiles WHERE user_id = ?`, [user.id]);
  (user as any).profile = profile;

  // Get role-specific data
  let roleData: any = null;
  if (user.role === 'admin') {
    roleData = await db.queryOne(`SELECT * FROM admin_users WHERE user_id = ?`, [user.id]);
  } else if (user.role === 'staff') {
    roleData = await db.queryOne(`SELECT s.*, t.name as teacher_name FROM staff_users s LEFT JOIN teachers t ON s.teacher_id = t.id WHERE s.user_id = ?`, [user.id]);
  } else if (user.role === 'student') {
    roleData = await db.queryOne(`SELECT su.*, s.name as student_name, c.name as class_name FROM student_users su LEFT JOIN students s ON su.student_id = s.id LEFT JOIN classes c ON s.class_id = c.id WHERE su.user_id = ?`, [user.id]);
  } else if (user.role === 'parent') {
    roleData = await db.queryOne(`SELECT * FROM parent_users WHERE user_id = ?`, [user.id]);
    if (roleData) {
      const children = await db.query(`SELECT pc.relationship, pc.is_primary, s.id, s.name, c.name as class_name FROM parent_children pc LEFT JOIN students s ON pc.student_id = s.id LEFT JOIN classes c ON s.class_id = c.id WHERE pc.parent_user_id = ?`, [roleData.id]);
      roleData.children = children;
    }
  }

  sendSuccess(res, { user, roleData }, 'Login successful');
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, role, phone, gender } = req.body;
  if (!email || !password || !name || !role) throw new ApiError(400, 'Email, password, name, and role are required');

  const validRoles = ['admin', 'staff', 'student', 'parent'];
  if (!validRoles.includes(role)) throw new ApiError(400, 'Invalid role');

  const existing = await db.queryOne(`SELECT id FROM users WHERE email = ?`, [email]);
  if (existing) throw new ApiError(400, 'Email already registered');

  const result = await db.insert(`INSERT INTO users (id, email, password_hash, role, is_active, is_verified) VALUES (UUID(), ?, ?, ?, true, false)`, [email, password, role]);
  const user = await db.queryOne(`SELECT * FROM users WHERE id = ?`, [result.insertId]);

  await db.insert(`INSERT INTO user_profiles (id, user_id, name, phone, gender) VALUES (UUID(), ?, ?, ?, ?)`, [user!.id, name, phone || '', gender || 'male']);

  sendSuccess(res, { id: user!.id, email: user!.email, role: user!.role }, 'Registration successful', 201);
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = await db.queryOne(`SELECT u.*, p.name, p.phone, p.avatar_url, p.address, p.gender FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = ?`, [userId]);
  if (!user) throw new ApiError(404, 'User not found');
  sendSuccess(res, user, 'Profile retrieved');
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { name, phone, address, avatar_url } = req.body;

  await db.update(`UPDATE user_profiles SET name = ?, phone = ?, address = ?, avatar_url = ? WHERE user_id = ?`, [name, phone, address, avatar_url, userId]);
  const profile = await db.queryOne(`SELECT * FROM user_profiles WHERE user_id = ?`, [userId]);
  sendSuccess(res, profile, 'Profile updated');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { currentPassword, newPassword } = req.body;

  const user = await db.queryOne(`SELECT password_hash FROM users WHERE id = ?`, [userId]);
  if (!user || user.password_hash !== currentPassword) throw new ApiError(401, 'Current password is incorrect');

  await db.update(`UPDATE users SET password_hash = ? WHERE id = ?`, [newPassword, userId]);
  sendSuccess(res, {}, 'Password changed successfully');
});

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.query;
  let sql = `SELECT u.*, p.name, p.phone, p.avatar_url FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE 1=1`;
  const params: any[] = [];
  if (role) { sql += ` AND u.role = ?`; params.push(role); }
  sql += ` ORDER BY u.created_at DESC`;

  const data = await db.query(sql, params);
  sendSuccess(res, data, 'Users retrieved');
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { is_active, is_verified } = req.body;

  await db.update(`UPDATE users SET is_active = ?, is_verified = ? WHERE id = ?`, [is_active, is_verified, userId]);
  const user = await db.queryOne(`SELECT * FROM users WHERE id = ?`, [userId]);
  sendSuccess(res, user, 'User status updated');
});
