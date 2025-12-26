import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client initialization.
 * Fallbacks are provided to prevent the application from crashing if environment
 * variables are not yet configured. Actual database operations will require 
 * valid credentials in .env.local or the deployment environment.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
