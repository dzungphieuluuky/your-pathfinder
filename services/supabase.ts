
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Document, KnowledgeNode, Invitation, WorkspaceMember, UserRole, InvitationStatus, Workspace } from '../types';

export const getSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 
              process.env.SUPABASE_URL || 
              (typeof window !== 'undefined' ? (window as any).NEXT_PUBLIC_SUPABASE_URL : undefined) ||
              (typeof window !== 'undefined' ? (window as any).SUPABASE_URL : undefined);
  
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
              process.env.SUPABASE_ANON_KEY || 
              process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
              process.env.SUPABASE_PUBLISHABLE_KEY ||
              (typeof window !== 'undefined' ? (window as any).NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined) ||
              (typeof window !== 'undefined' ? (window as any).SUPABASE_ANON_KEY : undefined);

  return { url, key };
};

const config = getSupabaseConfig();
export let supabase: SupabaseClient | null = (config.url && config.key) 
  ? createClient(config.url, config.key) 
  : null;

export class SupabaseService {
  private ensureClient(): SupabaseClient {
    if (!supabase) {
      const { url, key } = getSupabaseConfig();
      if (url && key) {
        supabase = createClient(url, key);
        return supabase;
      }
      throw new Error(`Supabase configuration missing.`);
    }
    return supabase;
  }

  async getOrCreateDefaultWorkspace(userId: string): Promise<Workspace> {
    const client = this.ensureClient();
    const { data: workspaces, error: fetchError } = await client
      .from('workspaces')
      .select('*')
      .limit(1);
    
    if (fetchError) throw fetchError;
    if (workspaces && workspaces.length > 0) return workspaces[0];

    const { data: newWs, error: insertError } = await client
      .from('workspaces')
      .insert({ name: 'Main Intelligence Vault', owner_id: userId })
      .select()
      .single();

    if (insertError) throw insertError;
    return newWs;
  }

  async getDocuments(workspaceId: string): Promise<Document[]> {
    const client = this.ensureClient();
    const { data, error } = await client
      .from('documents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async uploadDocument(file: File, category: string, workspaceId: string): Promise<Document> {
    const client = this.ensureClient();
    const timestamp = Date.now();
    const storagePath = `${workspaceId}/${timestamp}_${file.name}`;

    // Upload to Storage
    const { error: uploadError } = await client.storage
      .from('documents')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    if (uploadError) throw uploadError;

    // Get Public URL
    const { data: { publicUrl } } = client.storage
      .from('documents')
      .getPublicUrl(storagePath);

    // Save to Database
    const { data, error } = await client
      .from('documents')
      .insert({
        workspace_id: workspaceId,
        file_name: file.name,
        file_type: file.type || file.name.split('.').pop(),
        file_size: file.size,
        category,
        url: publicUrl,
        storage_path: storagePath
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteDocument(id: string, storagePath: string, fileName: string): Promise<void> {
    const client = this.ensureClient();
    const { error: storageError } = await client.storage
      .from('documents')
      .remove([storagePath]);
    if (storageError) console.error("Storage delete error:", storageError);

    await client.from('knowledge_embeddings').delete().filter('metadata->>file', 'eq', fileName);
    const { error: dbError } = await client.from('documents').delete().eq('id', id);
    if (dbError) throw dbError;
  }

  async saveKnowledgeEmbedding(params: {
    documentId: string;
    workspaceId: string;
    content: string;
    embedding: number[];
    category: string;
    metadata: any;
  }): Promise<void> {
    const client = this.ensureClient();
    const { error } = await client.from('knowledge_embeddings').insert({
      document_id: params.documentId,
      workspace_id: params.workspaceId,
      content: params.content,
      embedding: params.embedding,
      category: params.category,
      metadata: params.metadata
    });
    if (error) throw error;
  }

  async matchEmbeddings(queryEmbedding: number[], category: string, workspaceId: string): Promise<KnowledgeNode[]> {
    const client = this.ensureClient();
    const { data, error } = await client.rpc('match_embeddings', {
      query_embedding: queryEmbedding,
      match_threshold: 0.1,
      match_count: 5,
      filter_category: category === 'All' ? null : category,
      filter_workspace_id: workspaceId
    });
    
    if (error) throw error;
    
    return (data || []).map((item: any) => ({
      id: item.id.toString(),
      content: item.content,
      category: item.category,
      metadata: { 
        file: item.metadata?.file || "Unknown", 
        page: item.metadata?.page || 1, 
        url: item.metadata?.url 
      }
    }));
  }

  async getInvitations(workspaceId: string): Promise<Invitation[]> {
    const client = this.ensureClient();
    const { data, error } = await client
      .from('invitations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('invited_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const client = this.ensureClient();
    const { data, error } = await client
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('joined_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async revokeInvitation(id: string): Promise<void> {
    const client = this.ensureClient();
    const { error } = await client
      .from('invitations')
      .update({ status: InvitationStatus.REVOKED })
      .eq('id', id);
    if (error) throw error;
  }

  async createInvitation(email: string, role: UserRole, workspaceId: string): Promise<void> {
    const client = this.ensureClient();
    const { error } = await client.from('invitations').insert({
      email,
      role,
      workspace_id: workspaceId,
      status: InvitationStatus.PENDING,
      invited_at: new Date().toISOString()
    });
    if (error) throw error;
  }

  async saveFeedback(content: string, rating: boolean): Promise<void> {
    const client = this.ensureClient();
    await client.from('messages').insert({
      content,
      role: 'assistant',
      user_rating: rating
    });
  }
}

export const supabaseService = new SupabaseService();
