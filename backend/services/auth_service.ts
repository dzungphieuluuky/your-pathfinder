import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export class AuthService {
  async sendOtp(email: string) {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await supabase.from('users').upsert({
      email,
      role: 'End-User',
      is_active: false,
      otp_code: otpCode
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"RAG Admin" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Kích hoạt tài khoản RAG Assistant',
      text: `Chào bạn,\n\nMã kích hoạt tài khoản RAG của bạn là: ${otpCode}\n\nVui lòng đăng nhập và nhập mã này để đặt mật khẩu.`
    });

    return true;
  }

  async activate(email: string, otp: string, newPassword: string) {
    const { data } = await supabase.from('users').select('*').eq('email', email).single();
    if (data && data.otp_code === otp) {
      await supabase.from('users').update({ password: newPassword, is_active: true, otp_code: null }).eq('email', email);
      return true;
    }
    return false;
  }

  async login(email: string, password: string) {
    const { data } = await supabase.from('users').select('*').eq('email', email).single();
    if (data && data.is_active && data.password === password) {
      return { email: data.email, role: data.role };
    }
    return null;
  }
}