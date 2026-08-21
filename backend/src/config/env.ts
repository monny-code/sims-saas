import dotenv from 'dotenv';

dotenv.config();

const normalizePrivateKey = (value?: string) => (value ?? '').replace(/\\n/g, '\n').replace(/\r\n/g, '\n');

const parseServiceAccount = () => {
  const rawValue = process.env.FIREBASE_SERVICE_ACCOUNT ?? process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? '';

  if (!rawValue.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as Record<string, string>;
  } catch {
    return null;
  }
};

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? '';
const supabaseJwksUrl = process.env.SUPABASE_JWKS_URL ?? '';
const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'development-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigin: corsOrigins,
  appName: process.env.APP_NAME ?? 'SIMS',
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceRoleKey,
  supabaseJwksUrl,
  useFirebase: process.env.USE_FIREBASE === 'true',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID ?? parseServiceAccount()?.project_id ?? '',
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? parseServiceAccount()?.client_email ?? '',
  firebasePrivateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY ?? parseServiceAccount()?.private_key),
  firebaseServiceAccount: parseServiceAccount(),
};
