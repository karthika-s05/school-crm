import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error';

// Import original routes
import studentsRouter from './routes/students';
import teachersRouter from './routes/teachers';
import classesRouter from './routes/classes';
import attendanceRouter from './routes/attendance';
import feesRouter from './routes/fees';
import examsRouter from './routes/exams';
import timetableRouter from './routes/timetable';

// Import service routes
import authRoutes from './services/auth/routes';
import adminRoutes from './services/admin/routes';
import superAdminRoutes from './services/super-admin/routes';
import staffRoutes from './services/staff/routes';
import studentRoutes from './services/student/routes';
import parentRoutes from './services/parent/routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Original CRUD Routes (public access)
app.use('/api/students', studentsRouter);
app.use('/api/teachers', teachersRouter);
app.use('/api/classes', classesRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/fees', feesRouter);
app.use('/api/exams', examsRouter);
app.use('/api/timetable', timetableRouter);

// Authenticated Service Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/parent', parentRoutes);

// API Documentation route
app.get('/api', (req, res) => {
  res.json({
    message: 'School Management API',
    version: '1.0.0',
    endpoints: {
      public: {
        students: 'GET/POST/PUT/DELETE /api/students',
        teachers: 'GET/POST/PUT/DELETE /api/teachers',
        classes: 'GET/POST/PUT/DELETE /api/classes',
        attendance: 'GET/POST /api/attendance',
        fees: 'GET/POST /api/fees',
        exams: 'GET/POST/PUT/DELETE /api/exams',
        timetable: 'GET/POST/PUT/DELETE /api/timetable',
      },
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        profile: 'GET/PUT /api/auth/profile/:userId',
      },
      roles: {
        superAdmin: '/api/super-admin/*',
        admin: '/api/admin/*',
        staff: '/api/staff/*',
        student: '/api/student/*',
        parent: '/api/parent/*',
      },
    },
    demo_credentials: {
      super_admin: { email: 'superadmin@school.edu', password: 'password123' },
      admin: { email: 'admin@school.edu', password: 'password123' },
      staff: { email: 'sarah.mitchell@school.edu', password: 'password123' },
      student: { email: 'aiden.j@student.edu', password: 'password123' },
      parent: { email: 'mark.johnson@email.com', password: 'password123' },
    },
  });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  School Management API Server`);
  console.log(`  Running on http://localhost:${PORT}`);
  console.log(`========================================\n`);
  console.log('API Endpoints:');
  console.log('\n[Public Routes]');
  console.log('  GET    /api/health');
  console.log('  GET    /api');
  console.log('  GET    /api/students');
  console.log('  GET    /api/teachers');
  console.log('  GET    /api/classes');
  console.log('  GET    /api/attendance');
  console.log('  GET    /api/fees');
  console.log('  GET    /api/exams');
  console.log('\n[Auth Routes]');
  console.log('  POST   /api/auth/login');
  console.log('  POST   /api/auth/register');
  console.log('\n[Role-Based Services]');
  console.log('  /api/super-admin/*  - Super Admin dashboard');
  console.log('  /api/admin/*        - Admin dashboard');
  console.log('  /api/staff/*        - Staff/Teacher portal');
  console.log('  /api/student/*      - Student portal');
  console.log('  /api/parent/*       - Parent portal');
  console.log('\n[Demo Accounts] (password: password123)');
  console.log('  superadmin@school.edu');
  console.log('  admin@school.edu');
  console.log('  sarah.mitchell@school.edu');
  console.log('  aiden.j@student.edu');
  console.log('  mark.johnson@email.com');
  console.log('');
});

export default app;
