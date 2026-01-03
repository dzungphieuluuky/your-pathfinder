
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Document, KnowledgeNode, Invitation, WorkspaceMember, UserRole, InvitationStatus, Workspace } from '../types';

/**
 * Lấy cấu hình Supabase một cách an toàn từ nhiều nguồn:
 * 1. process.env (nếu có build tool)
 * 2. window (biến toàn cục)
 * 3. localStorage (fallback cho môi trường preview)
 */
export const getSupabaseConfig = () => {
  let url: string | undefined;
  let key: string | undefined;

  // 1. Thử lấy từ process.env (Next.js/Vite)
  try {
    url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  } catch (e) {
    // process không tồn tại trong browser thuần
  }

  // 2. Thử lấy từ window
  if (!url && typeof window !== 'undefined') {
    url = (window as any).NEXT_PUBLIC_SUPABASE_URL || (window as any).SUPABASE_URL;
  }
  if (!key && typeof window !== 'undefined') {
    key = (window as any).NEXT_PUBLIC_SUPABASE_ANON_KEY || (window as any).SUPABASE_ANON_KEY;
  }

  // 3. Fallback từ localStorage (Dành cho người dùng nhập tay khi env fail)
  if (!url && typeof window !== 'undefined') {
    url = localStorage.getItem('SUPABASE_URL_OVERRIDE') || undefined;
  }
  if (!key && typeof window !== 'undefined') {
    key = localStorage.getItem('SUPABASE_KEY_OVERRIDE') || undefined;
  }

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
      throw new Error(`Cấu hình Supabase chưa hoàn tất. Vui lòng kiểm tra lại URL và Key.`);
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
      .insert({ name: 'Kho Tri Thức Tổng Hợp', owner_id: userId })
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

    const { error: uploadError } = await client.storage
      .from('documents')
      .upload(storagePath, file);
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = client.storage
      .from('documents')
      .getPublicUrl(storagePath);

    const { data, error } = await client
      .from('documents')
      .insert({
        workspace_id: workspaceId,
        file_name: file.name,
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
    await client.storage.from('documents').remove([storagePath]);
    await client.from('documents').delete().eq('id', id);
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
    const { data, error } = await client.from('invitations').select('*').eq('workspace_id', workspaceId);
    if (error) throw error;
    return data || [];
  }

  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const client = this.ensureClient();
    const { data, error } = await client.from('workspace_members').select('*').eq('workspace_id', workspaceId);
    if (error) throw error;
    return data || [];
  }

  async createInvitation(email: string, role: UserRole, workspaceId: string): Promise<void> {
    const client = this.ensureClient();
    await client.from('invitations').insert({ email, role, workspace_id: workspaceId });
  }

  async revokeInvitation(id: string): Promise<void> {
    const client = this.ensureClient();
    await client.from('invitations').update({ status: InvitationStatus.REVOKED }).eq('id', id);
  }

  async saveFeedback(content: string, rating: boolean): Promise<void> {
    const client = this.ensureClient();
    // Feedback logic here
  }
}

export const supabaseService = new SupabaseService();
