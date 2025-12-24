import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const { action, email, password, otp, newPassword } = await req.json()

  if (action === 'send_otp') {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    await supabase.from('users').upsert({
      email,
      role: 'End-User',
      is_active: false,
      otp_code: otpCode
    })

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    })

    await transporter.sendMail({
      from: `"RAG Admin" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Kích hoạt tài khoản RAG',
      html: `<h3>Mã OTP của bạn là: <strong>${otpCode}</strong></h3>`
    })

    return NextResponse.json({ ok: true })
  }

  if (action === 'activate') {
    const { data } = await supabase.from('users').select('*').eq('email', email).single()
    
    if (data && data.otp_code === otp) {
      await supabase.from('users')
        .update({ password: newPassword, is_active: true, otp_code: null })
        .eq('email', email)
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ ok: false, error: 'OTP không đúng' }, { status: 400 })
  }

  if (action === 'login') {
    const { data } = await supabase.from('users').select('*').eq('email', email).single()
    
    if (data && data.is_active && data.password === password) {
      return NextResponse.json({ ok: true, user: { email: data.email, role: data.role } })
    }
    return NextResponse.json({ ok: false, error: 'Đăng nhập thất bại' }, { status: 401 })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}