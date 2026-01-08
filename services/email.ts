import nodemailer from 'nodemailer';

// Initialize Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export function generateInvitationEmailHTML(activationLink: string, role: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; color: #333; line-height: 1.6; }
          .role-badge { display: inline-block; background: #667eea; color: white; padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 12px; margin: 10px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .button:hover { background: #764ba2; }
          .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Your PathFinder</h1>
            <p>You're invited to collaborate</p>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You've been invited to join <strong>Your PathFinder</strong> as a <span class="role-badge">${role}</span></p>
            <p>Your PathFinder is a powerful knowledge management platform that helps teams organize, search, and collaborate on documents with AI-powered insights.</p>
            <p>Click the button below to accept your invitation and get started:</p>
            <center>
              <a href="${activationLink}" class="button">Accept Invitation</a>
            </center>
            <p style="color: #999; font-size: 13px;">
              If the button doesn't work, copy and paste this link in your browser:<br>
              <code style="background: #f0f0f0; padding: 8px; display: block; margin-top: 10px; word-break: break-all;">${activationLink}</code>
            </p>
            <p style="color: #999; font-size: 13px;">
              This link expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your PathFinder. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ messageId: string | null }> {
  try {
    const info = await transporter.sendMail({
      from: `"Your PathFinder" <${process.env.GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`[Email Service] ✓ Email sent successfully. Message ID: ${info.messageId}`);
    return { messageId: info.messageId };
  } catch (error: any) {
    console.error('[Email Service] ✗ Failed to send email:', error.message);
    throw new Error(`Email send failed: ${error.message}`);
  }
}