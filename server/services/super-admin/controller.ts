import { Request, Response } from 'express';
import { db } from '../config/db';
import { sendSuccess } from '../utils/response';
import { ApiError, asyncHandler } from '../../middleware/error';

export const getSystemDashboard = asyncHandler(async (req: Request, res: Response) => {
  const [userStats, studentCount, recentLogins] = await Promise.all([
    db.query(`SELECT role, is_active FROM users`),
    db.queryOne(`SELECT COUNT(*) as count FROM students`),
    db.query(`SELECT email, last_login FROM users ORDER BY last_login DESC LIMIT 10`),
  ]);

  const byRole: Record<string, number> = {};
  let active = 0;
  userStats.forEach((u: any) => {
    byRole[u.role] = (byRole[u.role] || 0) + 1;
    if (u.is_active) active++;
  });

  sendSuccess(res, {
    users: { total: userStats.length, active, byRole },
    school: { totalStudents: (studentCount as any)?.count || 0 },
    recentLogins,
  }, 'System dashboard retrieved');
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role, status } = req.query;
  let sql = `SELECT u.id, u.email, u.role, u.is_active, u.is_verified, u.last_login, u.created_at, p.name, p.phone, p.avatar_url FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE 1=1`;
  const params: any[] = [];

  if (role) { sql += ` AND u.role = ?`; params.push(role); }
  if (status === 'active') { sql += ` AND u.is_active = true`; }
  if (status === 'inactive') { sql += ` AND u.is_active = false`; }
  sql += ` ORDER BY u.created_at DESC`;

  const data = await db.query(sql, params);
  sendSuccess(res, data, 'Users retrieved');
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, role, name, phone } = req.body;
  if (!email || !password || !role || !name) throw new ApiError(400, 'Email, password, role, and name are required');

  const existing = await db.queryOne(`SELECT id FROM users WHERE email = ?`, [email]);
  if (existing) throw new ApiError(400, 'Email already exists');

  const result = await db.insert(`INSERT INTO users (id, email, password_hash, role, is_active, is_verified) VALUES (UUID(), ?, ?, ?, true, true)`, [email, password, role]);

  const user = await db.queryOne(`SELECT * FROM users WHERE id = ?`, [result.insertId]);
  if (user!.id) {
    await db.insert(`INSERT INTO user_profiles (id, user_id, name, phone) VALUES (UUID(), ?, ?, ?)`, [user!.id, name, phone || '']);
  }

  sendSuccess(res, user, 'User created', 201);
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { role, is_active, is_verified } = req.body;

  await db.update(`UPDATE users SET role = ?, is_active = ?, is_verified = ? WHERE id = ?`, [role, is_active, is_verified, userId]);
  const user = await db.queryOne(`SELECT * FROM users WHERE id = ?`, [userId]);
  sendSuccess(res, user, 'User updated');
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  await db.delete(`DELETE FROM users WHERE id = ?`, [userId]);
  sendSuccess(res, { id: userId }, 'User deleted');
});

export const getPermissions = asyncHandler(async (req: Request, res: Response) => {
  const data = await db.query(`SELECT * FROM permissions ORDER BY role`);
  sendSuccess(res, data, 'Permissions retrieved');
});

export const updatePermission = asyncHandler(async (req: Request, res: Response) => {
  const { permissionId } = req.params;
  const { allowed } = req.body;

  await db.update(`UPDATE permissions SET allowed = ? WHERE id = ?`, [allowed, permissionId]);
  const perm = await db.queryOne(`SELECT * FROM permissions WHERE id = ?`, [permissionId]);
  sendSuccess(res, perm, 'Permission updated');
});

export const resetUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { newPassword } = req.body;
  if (!newPassword) throw new ApiError(400, 'New password is required');

  await db.update(`UPDATE users SET password_hash = ? WHERE id = ?`, [newPassword, userId]);
  sendSuccess(res, {}, 'Password reset successfully');
});
