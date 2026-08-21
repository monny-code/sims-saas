import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const url = env.supabaseUrl;
const key = env.supabaseServiceRoleKey || env.supabaseAnonKey;

export const supabase = url && key
  ? createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

export const isSupabaseEnabled = Boolean(supabase);
