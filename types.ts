
export enum UserRole {
  ADMIN = 'Administrator',
  USER = 'End-User'
}

export enum InvitationStatus {
  PENDING = 'Pending',
  ACCEPTED = 'Accepted',
  REVOKED = 'Revoked'
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  color?: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  email: string;
  role: UserRole;
  joined_at: string;
  status: 'active' | 'inactive';
}

export interface Invitation {
  id: string;
  workspace_id: string;
  email: string;
  role: UserRole;
  status: InvitationStatus;
  invited_at: string;
  accepted_at?: string;
}

export interface Document {
  id: string;
  workspace_id: string;
  file_name: string;
  category: string;
  url?: string;
  storage_path?: string;
  created_at: string;
}

export interface Citation {
  file: string;
  page: number;
  url?: string;
}

export interface ClarificationAlert {
  title: string;
  content: string;
  source: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  alerts?: ClarificationAlert[];
  timestamp: Date;
  feedback?: 'up' | 'down';
}

export interface KnowledgeNode {
  id: string;
  content: string;
  category: string;
  metadata: {
    file: string;
    page: number;
    url?: string;
  };
}
