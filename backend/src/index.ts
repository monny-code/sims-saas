import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { env } from './config/env.js';
import authRoutes from './routes/auth.js';
import academicRoutes from './routes/academics.js';
import schoolRoutes from './routes/schools.js';
import studentRoutes from './routes/students.js';
import feeRoutes from './routes/fees.js';
import reportRoutes from './routes/reports.js';
import announcementRoutes from './routes/announcements.js';
import { ensureSupabaseSeeded } from './services/supabaseDataStore.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export const app = express();

// Render terminates TLS at one reverse proxy and forwards the client address
// in X-Forwarded-For. This lets rate limiting identify the actual client.
app.set('trust proxy', 1);

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

app.get('/', (_req, res) => {
  res.json({ success: true, message: 'SIMS backend is running', data: { api: '/api/v1/health' } });
});

app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, message: 'SIMS backend is healthy', data: { status: 'ok' } });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/schools', schoolRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/academics', academicRoutes);
app.use('/api/v1/fees', feeRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/announcements', announcementRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export const startServer = async () => {
  try {
    await ensureSupabaseSeeded();
  } catch (error) {
    console.warn('Supabase seed skipped:', error instanceof Error ? error.message : 'Unknown supabase error');
  }

  app.listen(env.port, () => {
    console.log(`${env.appName} backend running on http://localhost:${env.port}`);
  });
};

if (process.argv[1]?.includes('/src/index.ts') || process.argv[1]?.includes('/dist/index.js')) {
  void startServer();
}
