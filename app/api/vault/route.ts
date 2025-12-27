
import { supabaseService } from "../../../services/supabase";

/**
 * NEXT.JS API ROUTE: /api/vault
 * Manages workspace initialization.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    const workspace = await supabaseService.getOrCreateDefaultWorkspace(userId);
    return new Response(JSON.stringify(workspace), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');
  
  if (!workspaceId) {
    return new Response(JSON.stringify({ error: "Missing workspaceId" }), { status: 400 });
  }

  try {
    const members = await supabaseService.getWorkspaceMembers(workspaceId);
    return new Response(JSON.stringify(members), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
