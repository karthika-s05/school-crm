import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'school_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = {
  query: async <T>(sql: string, params?: any[]): Promise<T[]> => {
    const [rows] = await pool.execute(sql, params || []);
    return rows as T[];
  },

  queryOne: async <T>(sql: string, params?: any[]): Promise<T | null> => {
    const rows = await db.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  },

  insert: async (sql: string, params?: any[]): Promise<{ insertId: number; affectedRows: number }> => {
    const [result] = await pool.execute(sql, params || []);
    return result as { insertId: number; affectedRows: number };
  },

  update: async (sql: string, params?: any[]): Promise<{ affectedRows: number }> => {
    const [result] = await pool.execute(sql, params || []);
    return result as { affectedRows: number };
  },

  delete: async (sql: string, params?: any[]): Promise<{ affectedRows: number }> => {
    const [result] = await pool.execute(sql, params || []);
    return result as { affectedRows: number };
  },
};

export default pool;
