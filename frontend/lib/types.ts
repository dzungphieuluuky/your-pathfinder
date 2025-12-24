export type User = {
  email: string
  role: 'Administrator' | 'End-User'
  is_active: boolean
}

export type Message = {
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  timestamp?: string
}

export type Citation = {
  file: string
  page: number
  content?: string
}

export type Document = {
  id: string
  file_name: string
  category: 'HR' | 'IT' | 'Sales' | 'General'
  status: 'Completed' | 'Processing' | 'Failed'
  created_at: string
  url?: string
}

export type EmbeddingChunk = {
  id: string
  document_id: string
  content: string
  embedding: number[]
  metadata: {
    file: string
    page: number
    category: string
  }
}