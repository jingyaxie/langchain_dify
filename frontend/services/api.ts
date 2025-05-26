import axios from 'axios';
import { ApiResponse, Agent, Message, Collection, Document, ChatResponse, UploadResponse, Conversation, KnowledgeBase, DocumentChunk, SearchResult, IndexingProgress, CreateKnowledgeBaseParams, UploadDocumentParams, SearchParams, KnowledgeBaseListResponse, DocumentListResponse, IndexingProgressResponse, SharedUserListResponse, KnowledgeBasePermission, MessageUpdateResponse, MessageDeleteResponse } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加请求拦截器，处理认证
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 添加响应拦截器，处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 处理未认证错误
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface UsageStats {
  total_cost: number;
  total_tokens: number;
  provider_stats: {
    [key: string]: {
      total_cost: number;
      total_tokens: number;
      models: {
        [key: string]: {
          total_cost: number;
          total_tokens: number;
          operations: {
            [key: string]: {
              total_cost: number;
              total_tokens: number;
              count: number;
            };
          };
        };
      };
    };
  };
  period: {
    start: string | null;
    end: string | null;
  };
}

export interface UsageDetails {
  total: number;
  records: Array<{
    id: number;
    user_id: number;
    provider: string;
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost: number;
    operation: string;
    timestamp: string;
    request_id: string;
    metadata: string | null;
  }>;
  limit: number;
  offset: number;
}

// 聊天相关 API
export const chatApi = {
  sendMessage: async (message: string | FormData, conversationId?: string, agentId?: string): Promise<ChatResponse> => {
    const response = await api.post<ApiResponse<ChatResponse>>('/api/chat/message', message, {
      headers: message instanceof FormData ? {
        'Content-Type': 'multipart/form-data',
      } : {
        'Content-Type': 'application/json',
      },
    });
    return response.data.data;
  },

  deleteConversation: async (conversationId: string): Promise<void> => {
    await api.delete(`/api/chat/conversation/${conversationId}`);
  },

  listConversations: async (): Promise<Conversation[]> => {
    const response = await api.get<ApiResponse<Conversation[]>>('/api/chat/conversations');
    return response.data.data;
  },

  getConversation: async (conversationId: string): Promise<Conversation> => {
    const response = await api.get<ApiResponse<Conversation>>(`/api/chat/conversation/${conversationId}`);
    return response.data.data;
  },

  updateConversationTitle: async (conversationId: string, title: string): Promise<Conversation> => {
    const response = await api.put<ApiResponse<Conversation>>(`/api/chat/conversation/${conversationId}/title`, {
      title,
    });
    return response.data.data;
  },

  createConversation: async (title: string, agentId?: string): Promise<Conversation> => {
    const response = await api.post<ApiResponse<Conversation>>('/api/chat/conversation', {
      title,
      agent_id: agentId,
    });
    return response.data.data;
  },

  updateMessage: async (messageId: string, content: string): Promise<Message> => {
    const response = await api.put<ApiResponse<MessageUpdateResponse>>(`/api/chat/message/${messageId}`, {
      content,
    });
    return response.data.data.message;
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await api.delete<ApiResponse<MessageDeleteResponse>>(`/api/chat/message/${messageId}`);
  },

  getUsage: async (params: { start_date?: string; end_date?: string }): Promise<UsageStats> => {
    const response = await fetch('/api/billing/usage?' + new URLSearchParams(params));
    if (!response.ok) {
      throw new Error('Failed to fetch usage stats');
    }
    return response.json();
  },

  getUsageDetails: async (params: { limit?: number; offset?: number }): Promise<UsageDetails> => {
    const response = await fetch('/api/billing/usage/details?' + new URLSearchParams(params as any));
    if (!response.ok) {
      throw new Error('Failed to fetch usage details');
    }
    return response.json();
  },
};

// 知识库相关 API
export const knowledgeApi = {
  // 知识库管理
  listKnowledgeBases: () => 
    api.get<ApiResponse<KnowledgeBaseListResponse>>('/api/knowledge-bases'),
  
  getKnowledgeBase: (id: string) =>
    api.get<ApiResponse<KnowledgeBase>>(`/api/knowledge-bases/${id}`),
  
  createKnowledgeBase: (params: CreateKnowledgeBaseParams) =>
    api.post<ApiResponse<KnowledgeBase>>('/api/knowledge-bases', params),
  
  updateKnowledgeBase: (id: string, params: Partial<CreateKnowledgeBaseParams>) =>
    api.put<ApiResponse<KnowledgeBase>>(`/api/knowledge-bases/${id}`, params),
  
  deleteKnowledgeBase: (id: string) =>
    api.delete<ApiResponse<void>>(`/api/knowledge-bases/${id}`),

  // 文档管理
  listDocuments: (knowledgeBaseId: string) =>
    api.get<ApiResponse<DocumentListResponse>>(`/api/knowledge-bases/${knowledgeBaseId}/documents`),
  
  getDocument: (knowledgeBaseId: string, documentId: string) =>
    api.get<ApiResponse<Document>>(`/api/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`),
  
  uploadDocument: (params: UploadDocumentParams) => {
    const formData = new FormData();
    formData.append('file', params.file);
    if (params.tags) {
      formData.append('tags', JSON.stringify(params.tags));
    }
    return api.post<ApiResponse<Document>>(
      `/api/knowledge-bases/${params.knowledge_base_id}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },
  
  deleteDocument: (knowledgeBaseId: string, documentId: string) =>
    api.delete<ApiResponse<void>>(`/api/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`),
  
  updateDocument: (knowledgeBaseId: string, documentId: string, updates: Partial<Document>) =>
    api.put<ApiResponse<Document>>(
      `/api/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`,
      updates
    ),

  // 文档块管理
  listDocumentChunks: (knowledgeBaseId: string, documentId: string) =>
    api.get<ApiResponse<{ chunks: DocumentChunk[] }>>(
      `/api/knowledge-bases/${knowledgeBaseId}/documents/${documentId}/chunks`
    ),

  // 搜索
  search: (params: SearchParams) =>
    api.post<ApiResponse<{ results: SearchResult[] }>>('/api/knowledge-bases/search', params),

  // 索引进度
  getIndexingProgress: (knowledgeBaseId: string) =>
    api.get<ApiResponse<IndexingProgressResponse>>(`/api/knowledge-bases/${knowledgeBaseId}/indexing-progress`),

  // 权限管理
  listSharedUsers: (knowledgeBaseId: string) =>
    api.get<ApiResponse<SharedUserListResponse>>(`/api/knowledge-bases/${knowledgeBaseId}/shared-users`),
  
  shareKnowledgeBase: (knowledgeBaseId: string, userId: string, permission: string) =>
    api.post<ApiResponse<KnowledgeBasePermission>>(
      `/api/knowledge-bases/${knowledgeBaseId}/share`,
      { user_id: userId, permission }
    ),
  
  updatePermission: (knowledgeBaseId: string, userId: string, permission: string) =>
    api.put<ApiResponse<KnowledgeBasePermission>>(
      `/api/knowledge-bases/${knowledgeBaseId}/permissions/${userId}`,
      { permission }
    ),
  
  removePermission: (knowledgeBaseId: string, userId: string) =>
    api.delete<ApiResponse<void>>(`/api/knowledge-bases/${knowledgeBaseId}/permissions/${userId}`),
};

// 智能体相关 API
export const agentApi = {
  listAgents: async (): Promise<Record<string, Agent>> => {
    const response = await api.get<ApiResponse<Record<string, Agent>>>('/api/agents');
    return response.data.data;
  },

  getAgent: async (agentId: string): Promise<Agent> => {
    const response = await api.get<ApiResponse<Agent>>(`/api/agents/${agentId}`);
    return response.data.data;
  },

  createAgent: async (agentId: string, config: Partial<Agent>): Promise<Agent> => {
    const response = await api.post<ApiResponse<Agent>>(`/api/agents/${agentId}`, config);
    return response.data.data;
  },

  updateAgent: async (agentId: string, config: Partial<Agent>): Promise<Agent> => {
    const response = await api.put<ApiResponse<Agent>>(`/api/agents/${agentId}`, config);
    return response.data.data;
  },

  deleteAgent: async (agentId: string): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/api/agents/${agentId}`);
  },
}; 