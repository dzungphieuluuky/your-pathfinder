
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Document, KnowledgeNode, Invitation, WorkspaceMember, UserRole, InvitationStatus, Workspace } from '../types';

/**
 * PATHFINDER SUPABASE SERVICE
 * 
 * Supports both Next.js prefixed and standard environment variable names.
 * Standard (Python-style): SUPABASE_URL, SUPABASE_KEY
 * Next.js (Browser-style): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

const supabaseUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  'https://your-project.supabase.co';

const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  process.env.SUPABASE_KEY || 
  'your-key';

// Validation logic to prevent the "Failed to fetch" error
const isConfigured = 
  supabaseUrl !== 'https://your-project.supabase.co' && 
  supabaseAnonKey !== 'your-key' &&
  supabaseUrl.startsWith('https://');

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export class SupabaseService {
  /**
   * Helper to verify if the service is actually connected to a real backend.
   */
  checkConfiguration() {
    if (!isConfigured) {
      console.error("Configuration Check Failed:", { url: supabaseUrl, hasKey: !!supabaseAnonKey });
      throw new Error("SUPABASE_CONFIG_MISSING");
    }
  }

  /**
   * --- FEATURE 1: CORE VAULT ---
   */
  async getOrCreateDefaultWorkspace(userId: string): Promise<Workspace> {
    this.checkConfiguration();
    
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

      await supabase.from('workspace_members').insert({
        workspace_id: newWs.id,
        user_id: userId,
        role: UserRole.ADMIN,
        status: 'active',
        joined_at: new Date().toISOString()
      });

      return newWs;
    } catch (err: any) {
      console.error("[Supabase] Initialization Error:", err);
      if (err.message === 'Failed to fetch') {
        throw new Error("CONNECTION_REFUSED");
      }
      throw err;
    }
  }

  /**
   * --- FEATURE 2: DOCUMENT UPLOADS ---
   */
  async getDocuments(workspaceId: string): Promise<Document[]> {
    this.checkConfiguration();
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async uploadDocument(file: File, category: string, workspaceId: string): Promise<Document> {
    this.checkConfiguration();
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

    if (error) {
      await supabase.storage.from('documents').remove([storagePath]);
      throw error;
    }
    return data;
  }

  async deleteDocument(id: string, storagePath: string): Promise<void> {
    this.checkConfiguration();
    await supabase.storage.from('documents').remove([storagePath]);
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) throw error;
  }

  /**
   * --- FEATURE 3: RAG ---
   */
  async matchEmbeddings(queryEmbedding: number[], category: string, workspaceId: string): Promise<KnowledgeNode[]> {
    this.checkConfiguration();
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 5,
      filter_category: category === 'All' ? null : category,
      filter_workspace_id: workspaceId
    });
    
    if (error) {
      const { data: fallback } = await supabase
        .from('documents')
        .select('*')
        .eq('workspace_id', workspaceId)
        .limit(3);

      return (fallback || []).map(d => ({
        id: d.id,
        content: `Indexing Ref: ${d.file_name}. (Note: Vector search RPC not detected).`,
        category: d.category,
        metadata: { file: d.file_name, page: 1, url: d.url }
      }));
    }
    return (data || []).map((item: any) => ({
      id: item.id,
      content: item.content,
      category: item.category,
      metadata: { file: item.file_name, page: item.page_number || 1, url: item.url }
    }));
  }

  /**
   * --- FEATURE 4: INVITATIONS ---
   */
  async getInvitations(workspaceId: string): Promise<Invitation[]> {
    this.checkConfiguration();
    const { data, error } = await supabase.from('invitations').select('*').eq('workspace_id', workspaceId);
    return data || [];
  }

  async createInvitation(email: string, role: UserRole, workspaceId: string): Promise<Invitation> {
    this.checkConfiguration();
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
    this.checkConfiguration();
    await supabase.from('invitations').update({ status: InvitationStatus.REVOKED }).eq('id', id);
  }

  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    this.checkConfiguration();
    const { data, error } = await supabase.from('workspace_members').select('*').eq('workspace_id', workspaceId);
    return data || [];
  }
}

export const supabaseService = new SupabaseService();
