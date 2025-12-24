import { redirect } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase';

// This is a Server Component
export default async function HomePage() {
  // Check if user is logged in using Supabase (Server-side)
  const supabase = getServiceSupabase();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}