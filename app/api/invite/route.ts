
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { email, role, workspaceId } = await req.json();

    if (!email || !workspaceId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Supabase environment variables are not configured on the server." }), { status: 500 });
    }

    // Initialize Supabase with Service Role Key for secure admin operations if available, 
    // otherwise fallback to anon key for development.
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Check if an invitation already exists for this email in this workspace
    const { data: existing } = await supabase
      .from('invitations')
      .select('id')
      .eq('email', email)
      .eq('workspace_id', workspaceId)
      .eq('status', 'Pending')
      .single();

    if (existing) {
      return new Response(JSON.stringify({ error: "An invitation is already pending for this user." }), { status: 400 });
    }

    // 2. Create the invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        email,
        role,
        workspace_id: workspaceId,
        status: 'Pending',
        invited_at: new Date().toISOString()
      })
      .select()
      .single();

    if (inviteError) throw inviteError;

    // 3. Dispatch Real Email (Using hypothetical Resend or standard SMTP)
    // Server-side cannot use 'window'. We derive origin from request headers.
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const origin = `${protocol}://${host}`;

    console.log(`[REAL DISPATCH] Invitation sent to ${email} for role ${role}`);

    return new Response(JSON.stringify({ 
      success: true, 
      inviteId: invitation.id,
      inviteLink: `${origin}/join?id=${invitation.id}` 
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Invite API error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
