const { sendEmail, generateInvitationEmailHTML } = require('../../../services/email');

export async function POST(req: Request) {
  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError: any) {
      console.error('[API] JSON parse error:', parseError.message);
      return Response.json(
        { 
          success: false,
          error: 'Invalid JSON in request body',
          message: parseError.message
        },
        { status: 400 }
      );
    }

    const { email, role, workspaceId, invitationId, token } = body;

    // Validate required fields
    if (!email || !role || !workspaceId || !token) {
      console.error('[API] Missing required fields:', { email, role, workspaceId, token });
      return Response.json(
        { 
          success: false,
          error: 'Missing required fields',
          message: 'Required fields: email, role, workspaceId, token, invitationId'
        },
        { status: 400 }
      );
    }

    console.log(`[API] Sending invitation email to ${email}...`);

    // Generate activation link
    const appUrl = process.env.VITE_APP_URL || 
                   process.env.NEXT_PUBLIC_APP_URL || 
                   'http://localhost:3000';
    
    const activationLink = `${appUrl}/#/accept-invitation?token=${token}&invitationId=${invitationId}`;
    console.log(`[API] Activation link: ${activationLink}`);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('[API] Invalid email format:', email);
      return Response.json(
        { 
          success: false,
          error: 'Invalid email format',
          message: `Email "${email}" is not valid`
        },
        { status: 400 }
      );
    }

    // Generate email HTML
    let htmlContent;
    try {
      htmlContent = generateInvitationEmailHTML(activationLink, role);
    } catch (generateError: any) {
      console.error('[API] Email HTML generation error:', generateError.message);
      return Response.json(
        { 
          success: false,
          error: 'Failed to generate email template',
          message: generateError.message
        },
        { status: 500 }
      );
    }

    // Send email
    let result;
    try {
      result = await sendEmail({
        to: email,
        subject: `You're invited to join Your PathFinder as ${role}`,
        html: htmlContent,
        text: `You've been invited to join Your PathFinder as a ${role}. Click here to accept: ${activationLink}`,
      });
    } catch (emailError: any) {
      console.error('[API] Email send error:', emailError.message);
      return Response.json(
        { 
          success: false,
          error: 'Failed to send email',
          message: emailError.message || 'Email service error'
        },
        { status: 500 }
      );
    }

    console.log(`[API] ✓ Email sent successfully to ${email}`, result);

    // Return success response
    const successResponse = {
      success: true,
      message: `Invitation email sent to ${email}`,
      messageId: result.messageId || null,
      email: email,
      timestamp: new Date().toISOString()
    };

    console.log('[API] Sending success response:', successResponse);
    return Response.json(successResponse, { status: 200 });

  } catch (error: any) {
    console.error('[API] ✗ Unexpected error in send-invitation-email:', error);
    return Response.json(
      {
        success: false,
        error: 'Unexpected server error',
        message: error.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}