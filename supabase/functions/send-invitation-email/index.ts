import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SmtpClient } from "https://deno.land/std@0.168.0/smtp/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, role, workspaceId } = await req.json()

    if (!email || !role || !workspaceId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const gmailUser = Deno.env.get('GMAIL_USER')
    const gmailAppPassword = Deno.env.get('GMAIL_APP_PASSWORD')
    const appUrl = Deno.env.get('VITE_APP_URL') || 'http://localhost:3000'

    if (!gmailUser || !gmailAppPassword) {
      console.error('[Edge Function] Gmail credentials not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = btoa(`${email}-${Date.now()}`)
    const activationLink = `${appUrl}/#/accept-invitation?token=${token}&workspaceId=${workspaceId}`

    const htmlContent = generateEmailHTML(activationLink, role)
    const textContent = generateEmailText(activationLink, role)

    const client = new SmtpClient()
    
    await client.connectTLS({
      hostname: 'smtp.gmail.com',
      port: 465,
      username: gmailUser,
      password: gmailAppPassword,
    })

    await client.send({
      from: `Your PathFinder <${gmailUser}>`,
      to: email,
      subject: `You're invited to join Your PathFinder as ${role}`,
      content: textContent,
      html: htmlContent,
    })

    await client.close()

    console.log(`[Edge Function] ✓ Invitation email sent to ${email}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation email sent successfully',
        email: email,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('[Edge Function] ✗ Error sending email:', error.message)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateEmailHTML(activationLink: string, role: string): string {
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
          .button { display: inline-block; background: #667eea; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px auto; }
          .button:hover { background: #764ba2; }
          .button-container { text-align: center; }
          .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
          code { background: #f0f0f0; padding: 8px; display: block; margin-top: 10px; word-break: break-all; border-radius: 4px; }
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
            <div class="button-container">
              <a href="${activationLink}" class="button">Accept Invitation</a>
            </div>
            <p style="color: #999; font-size: 13px;">
              If the button doesn't work, copy and paste this link in your browser:<br>
              <code>${activationLink}</code>
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
  `
}

function generateEmailText(activationLink: string, role: string): string {
  return `
Hello,

You've been invited to join Your PathFinder as a ${role}.

Your PathFinder is a powerful knowledge management platform that helps teams organize, search, and collaborate on documents with AI-powered insights.

Click the link below to accept your invitation:
${activationLink}

This link expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.

---
Your PathFinder Team
  `
}