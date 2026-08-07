import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Server-side Supabase client using the service-role key. This bypasses RLS,
// so it must never be exposed to the frontend. Auth session persistence is
// disabled — the backend is stateless.
export const supabase = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const bucket = () => supabase.storage.from(env.supabase.bucket);
