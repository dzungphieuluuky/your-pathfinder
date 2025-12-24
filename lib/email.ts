import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function sendOTPEmail(email: string, otpCode: string) {
  const mailOptions = {
    from: `RAG Admin <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Kich hoat tai khoan RAG Assistant',
    text: `Chào bạn,\n\nMã kích hoạt tài khoản RAG của bạn là: ${otpCode}\n\nVui lòng đăng nhập và nhập mã này để đặt mật khẩu.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}