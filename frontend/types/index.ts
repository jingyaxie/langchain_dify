// API 响应类型
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

// 智能体类型
export interface Agent {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  temperature: number;
  tools: string[];
  knowledge_base?: string;
  created_at: string;
  updated_at: string;
}

// 消息类型
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  created_at: string;
  reply_to?: string;
  attachments?: Attachment[];
}

// 知识库类型
export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  embedding_model: string;
  retrieval_model: string;
  chunk_size: number;
  chunk_overlap: number;
  indexing_technique: 'high_quality' | 'economy';
  status: 'active' | 'archived';
  document_count: number;
  word_count: number;
  permission: 'private' | 'public';
  created_at: string;
  updated_at: string;
}

// 文档类型
export interface Document {
  id: string;
  knowledge_base_id: string;
  name: string;
  url?: string;
  content_type: string;
  size: number;
  created_at: string;
  updated_at: string;
  chunk_count: number;
  word_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  tags?: string[];
}

// 知识库集合类型
export interface Collection {
  id: string;
  name: string;
  description: string;
  document_count: number;
  created_at: string;
  updated_at: string;
}

// 对话类型
export interface Conversation {
  id: string;
  title: string;
  agent_id: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

// 源文档类型
export interface Source {
  id: string;
  content: string;
  metadata: {
    source: string;
    page?: number;
    [key: string]: any;
  };
  score: number;
}

// 附件类型
export interface Attachment {
  id: string;
  type: 'file' | 'image' | 'audio';
  name: string;
  url: string;
  size: number;
  mime_type: string;
  created_at: string;
}

// 文件上传响应类型
export interface UploadResponse {
  document_id: string;
  collection_name: string;
  status: 'success' | 'error';
  message?: string;
  attachment?: Attachment;
}

// 聊天响应类型
export interface ChatResponse {
  conversation_id: string;
  message: Message;
  sources?: Source[];
}

// 文档块类型
export interface DocumentChunk {
  id: string;
  document_id: string;
  content: string;
  metadata: {
    page?: number;
    section?: string;
    source?: string;
    [key: string]: any;
  };
  embedding?: number[];
  created_at: string;
  updated_at: string;
}

// 搜索结果类型
export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
  document: Document;
}

// 索引进度类型
export interface IndexingProgress {
  total: number;
  processed: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

// 知识库创建参数
export interface CreateKnowledgeBaseParams {
  name: string;
  description?: string;
  embedding_model: string;
  retrieval_model: string;
  chunk_size: number;
  chunk_overlap: number;
  indexing_technique: 'high_quality' | 'economy';
  permission: 'private' | 'public';
}

// 文档上传参数
export interface UploadDocumentParams {
  knowledge_base_id: string;
  file: File;
  tags?: string[];
}

// 文档搜索参数
export interface SearchParams {
  knowledge_base_id: string;
  query: string;
  limit?: number;
  score_threshold?: number;
  rerank?: boolean;
}

// 知识库列表响应
export interface KnowledgeBaseListResponse {
  knowledge_bases: KnowledgeBase[];
}

// 文档列表响应
export interface DocumentListResponse {
  documents: Document[];
}

// 索引进度响应
export interface IndexingProgressResponse {
  progress: IndexingProgress;
}

// 用户类型
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

// 知识库权限类型
export interface KnowledgeBasePermission {
  id: string;
  knowledge_base_id: string;
  user_id: string;
  permission: 'owner' | 'editor' | 'viewer';
  created_at: string;
  updated_at: string;
}

// 认证响应类型
export interface AuthResponse {
  token: string;
  user: User;
}

// 共享用户类型
export interface SharedUser {
  user: User;
  permission: string;
}

// 共享用户列表响应
export interface SharedUserListResponse {
  users: SharedUser[];
}

// 消息更新响应
export interface MessageUpdateResponse {
  message: Message;
}

// 消息删除响应
export interface MessageDeleteResponse {
  success: boolean;
  message: string;
} 