import { createClient } from '@supabase/supabase-js'

export async function sendInvitationEmail(
  email: string,
  role: string,
  workspaceId: string
): Promise<{ success: boolean; error?: string; inviteId?: string }> {
  try {
    const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL
    const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing')
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Invoke the edge function with proper headers
    const { data, error } = await supabase.functions.invoke('send-invitation-email', {
      body: {
        email,
        role,
        workspaceId,
      },
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
      },
    })

    if (error) {
      throw new Error(error.message || 'Failed to send invitation email')
    }

    console.log('[Invitation Service] ✓ Invitation created and email is being sent', data)

    return {
      success: true,
      inviteId: data?.invite?.id,
    }
  } catch (error: any) {
    console.error('[Invitation Service] ✗ Failed to send invitation:', error.message)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    }
  }
}