import { createClient } from '@supabase/supabase-js';
import { ENV } from './env';

export const supabase =
  ENV.SUPABASE_URL && ENV.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY)
    : null;

export const isSupabaseStorageReady = () => Boolean(supabase);
