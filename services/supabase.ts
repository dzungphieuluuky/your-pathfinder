
import { supabase } from '../lib/supabase';
import { Document, KnowledgeNode, Invitation, WorkspaceMember, UserRole, InvitationStatus, Workspace } from '../types';

export class SupabaseService {
  public supabase = supabase;

  // --- Workspace Methods ---
  async getWorkspaces(userId: string): Promise<Workspace[]> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .or(`owner_id.eq.${userId},id.in.(select workspace_id from workspace_members where user_id.eq.${userId})`);
    
    // Fallback for demo if DB is empty
    if (!data || data.length === 0) return [];
    return data;
  }

  async createWorkspace(name: string, userId: string): Promise<Workspace> {
    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name, owner_id: userId, created_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;

    // Automatically make creator an admin member
    await supabase.from('workspace_members').insert({
      workspace_id: data.id,
      user_id: userId,
      role: UserRole.ADMIN,
      status: 'active',
      joined_at: new Date().toISOString()
    });

    return data;
  }

  async deleteWorkspace(workspaceId: string) {
    const { error } = await supabase.from('workspaces').delete().eq('id', workspaceId);
    if (error) throw error;
  }

  // --- Scoped Document Methods ---
  async getDocuments(workspaceId?: string): Promise<Document[]> {
    if (!workspaceId) return [];
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async uploadDocument(file: File, category: string, workspaceId: string): Promise<Document> {
    const filePath = `${workspaceId}/${category}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    const { data, error } = await supabase
      .from('documents')
      .insert({
        workspace_id: workspaceId,
        file_name: file.name,
        category: category,
        url: urlData.publicUrl,
        storage_path: filePath
      })
      .select()
      .single();
    if (error) throw error;

    // Trigger simulated notification
    await this.broadcastWorkspaceActivity(workspaceId, 'uploaded', file.name);

    return data;
  }

  async deleteDocument(id: string, storagePath: string, workspaceId: string, fileName: string) {
    await supabase.storage.from('documents').remove([storagePath]);
    const { error: dbError } = await supabase.from('documents').delete().eq('id', id);
    if (dbError) throw dbError;

    // Trigger simulated notification
    await this.broadcastWorkspaceActivity(workspaceId, 'deleted', fileName);
  }

  private async broadcastWorkspaceActivity(workspaceId: string, action: string, fileName: string) {
    // 1. Get all members of the workspace
    const { data: members } = await supabase
      .from('workspace_members')
      .select('email')
      .eq('workspace_id', workspaceId);

    if (members && members.length > 0) {
      console.log(`[Email System] Workspace Event: ${action.toUpperCase()}`);
      console.log(`Resource: ${fileName}`);
      members.forEach(m => {
        console.log(`>>> Sending notification dispatch to: ${m.email}`);
      });
    }
  }

  async matchEmbeddings(queryEmbedding: number[], category: string, workspaceId: string, threshold: number = 0.5, matchCount: number = 5): Promise<KnowledgeNode[]> {
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: matchCount,
      filter_category: category === 'All' ? null : category,
      filter_workspace_id: workspaceId
    });
    if (error) return [];
    return (data || []).map((item: any) => ({
      id: item.id,
      content: item.content,
      category: item.category,
      metadata: { file: item.file_name, page: item.page_number, url: item.url }
    }));
  }

  // --- Scoped Invitation Methods ---
  async getInvitations(workspaceId: string): Promise<Invitation[]> {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('invited_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async createInvitation(email: string, role: UserRole, workspaceId: string): Promise<Invitation> {
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        workspace_id: workspaceId,
        email,
        role,
        status: InvitationStatus.PENDING,
        invited_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Added revokeInvitation fix
  async revokeInvitation(id: string) {
    const { error } = await supabase
      .from('invitations')
      .update({ status: InvitationStatus.REVOKED })
      .eq('id', id);
    if (error) throw error;
  }

  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('joined_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async notifyAdminOfFailure(fileName: string, error: string) {
    console.error(`Admin Notification: ${fileName} failed indexing. Error: ${error}`);
    return true;
  }
}

export const supabaseService = new SupabaseService();