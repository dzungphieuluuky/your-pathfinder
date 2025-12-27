
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Document, KnowledgeNode, Invitation, WorkspaceMember, UserRole, InvitationStatus, Workspace } from '../types';

/**
 * PATHFINDER SUPABASE SERVICE
 */

const supabaseUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  '';

const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  process.env.SUPABASE_KEY || 
  '';

// Mock mode detection
const isConfigured = supabaseUrl && supabaseUrl.startsWith('https://') && supabaseAnonKey;

// Initialize client only if configured, otherwise use a proxy or null
export const supabase: SupabaseClient = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

export class SupabaseService {
  /**
   * Helper to verify configuration and provide mock data for local testing
   */
  checkConfiguration() {
    if (!isConfigured) {
      console.warn("SUPABASE_CONFIG_MISSING: Running in Mock Mode. Data will not persist.");
      return false;
    }
    return true;
  }

  async getOrCreateDefaultWorkspace(userId: string): Promise<Workspace> {
    if (!this.checkConfiguration()) {
      // Return a mock workspace so the UI can render
      return {
        id: 'mock-id',
        name: 'Mock Local Vault (Offline)',
        owner_id: userId,
        created_at: new Date().toISOString()
      };
    }
    
    try {
      const { data: workspaces, error: fetchError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('name', 'Global Intelligence Vault')
        .limit(1);

      if (fetchError) throw fetchError;

      if (workspaces && workspaces.length > 0) {
        return workspaces[0];
      }

      const { data: newWs, error: createError } = await supabase
        .from('workspaces')
        .insert({ 
          name: 'Global Intelligence Vault', 
          owner_id: userId, 
          created_at: new Date().toISOString() 
        })
        .select()
        .single();

      if (createError) throw createError;

      return newWs;
    } catch (err: any) {
      console.error("[Supabase] Initialization Error:", err);
      // Fallback to mock on error to allow UI exploration
      return {
        id: 'error-id',
        name: 'Connection Error Vault',
        owner_id: userId,
        created_at: new Date().toISOString()
      };
    }
  }

  async getDocuments(workspaceId: string): Promise<Document[]> {
    if (!isConfigured) return [];
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  }

  async uploadDocument(file: File, category: string, workspaceId: string): Promise<Document> {
    if (!isConfigured) throw new Error("MOCK_MODE_UPLOAD_DISABLED");
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${workspaceId}/${category}/${timestamp}_${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file);
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(storagePath);

    const { data, error } = await supabase
      .from('documents')
      .insert({
        workspace_id: workspaceId,
        file_name: file.name,
        category: category,
        url: urlData.publicUrl,
        storage_path: storagePath
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteDocument(id: string, storagePath: string): Promise<void> {
    if (!isConfigured) return;
    await supabase.storage.from('documents').remove([storagePath]);
    await supabase.from('documents').delete().eq('id', id);
  }

  async matchEmbeddings(queryEmbedding: number[], category: string, workspaceId: string): Promise<KnowledgeNode[]> {
    if (!isConfigured) {
      return [{
        id: 'mock-node',
        content: "You are currently in Mock Mode because Supabase keys are missing. Please add your SUPABASE_URL and SUPABASE_ANON_KEY to your environment variables to enable real document searching.",
        category: 'System',
        metadata: { file: 'System_Log.txt', page: 1 }
      }];
    }
    
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 5,
      filter_category: category === 'All' ? null : category,
      filter_workspace_id: workspaceId
    });
    
    if (error || !data) return [];
    
    return data.map((item: any) => ({
      id: item.id,
      content: item.content,
      category: item.category,
      metadata: { file: item.file_name, page: item.page_number || 1, url: item.url }
    }));
  }

  async getInvitations(workspaceId: string): Promise<Invitation[]> {
    if (!isConfigured) return [];
    const { data } = await supabase.from('invitations').select('*').eq('workspace_id', workspaceId);
    return data || [];
  }

  async createInvitation(email: string, role: UserRole, workspaceId: string): Promise<Invitation> {
    if (!isConfigured) throw new Error("MOCK_MODE_INVITE_DISABLED");
    const { data, error } = await supabase.from('invitations').insert({
      workspace_id: workspaceId,
      email,
      role,
      status: InvitationStatus.PENDING,
      invited_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    return data;
  }

  async revokeInvitation(id: string): Promise<void> {
    if (!isConfigured) return;
    await supabase.from('invitations').update({ status: InvitationStatus.REVOKED }).eq('id', id);
  }

  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    if (!isConfigured) return [];
    const { data } = await supabase.from('workspace_members').select('*').eq('workspace_id', workspaceId);
    return data || [];
  }
}

export const supabaseService = new SupabaseService();
