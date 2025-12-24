import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_KEY!;

if (!url || !key) {
  throw new Error("Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_KEY trong tệp cấu hình");
}

export const supabase = createClient(url, key);