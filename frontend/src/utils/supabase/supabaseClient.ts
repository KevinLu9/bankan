import { createClient } from '@supabase/supabase-js';
import { Database } from 'schema-v2';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

const supabaseClient = createClient<Database>(supabaseUrl, supabaseKey);
export const getSupabaseClient = () => {
  return supabaseClient;
};
