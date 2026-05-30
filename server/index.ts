import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error';

import studentsRouter from './routes/students';
import teachersRouter from './routes/teachers';
import classesRouter from './routes/classes';
import attendanceRouter from './routes/attendance';
import feesRouter from './routes/fees';
import examsRouter from './routes/exams';
import timetableRouter from './routes/timetable';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/students', studentsRouter);
app.use('/api/teachers', teachersRouter);
app.use('/api/classes', classesRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/fees', feesRouter);
app.use('/api/exams', examsRouter);
app.use('/api/timetable', timetableRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('API Endpoints:');
  console.log('  GET    /api/health');
  console.log('  GET    /api/students');
  console.log('  POST   /api/students');
  console.log('  GET    /api/teachers');
  console.log('  POST   /api/teachers');
  console.log('  GET    /api/classes');
  console.log('  GET    /api/attendance');
  console.log('  POST   /api/attendance');
  console.log('  GET    /api/fees');
  console.log('  GET    /api/exams');
});

export default app;
