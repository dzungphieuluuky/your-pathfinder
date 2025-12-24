import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendOTPEmail, generateOTP } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    const otpCode = generateOTP();

    // Send email
    const emailSent = await sendOTPEmail(email, otpCode);

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    // Save to database
    const { error } = await supabase.from('users').upsert({
      email,
      role: 'End-User',
      is_active: false,
      otp_code: otpCode,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}