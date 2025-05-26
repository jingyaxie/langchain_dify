import { DOCUMENT_CONFIG } from '../config/env';
import { apiClient } from './apiClient';
import { modelConfigManager } from './modelConfig';

// 文档处理状态
export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// 文档块接口
export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    page?: number;
    section?: string;
    source?: string;
    [key: string]: any;
  };
  embedding?: number[];
}

// 文档处理结果接口
export interface ProcessingResult {
  status: ProcessingStatus;
  chunks: DocumentChunk[];
  error?: string;
  progress?: number;
}

// 文档处理器类
export class DocumentProcessor {
  private static instance: DocumentProcessor;

  private constructor() {}

  public static getInstance(): DocumentProcessor {
    if (!DocumentProcessor.instance) {
      DocumentProcessor.instance = new DocumentProcessor();
    }
    return DocumentProcessor.instance;
  }

  // 处理文档
  public async processDocument(file: File): Promise<ProcessingResult> {
    try {
      // 验证文件
      if (!this.validateFile(file)) {
        throw new Error('Invalid file type or size');
      }

      // 上传文件
      const formData = new FormData();
      formData.append('file', file);
      const uploadResponse = await apiClient.post<{ document_id: string }>('/api/documents/upload', formData);

      // 开始处理
      const processResponse = await apiClient.post<ProcessingResult>('/api/documents/process', {
        document_id: uploadResponse.document_id,
        chunk_size: DOCUMENT_CONFIG.CHUNK.DEFAULT_SIZE,
        chunk_overlap: DOCUMENT_CONFIG.CHUNK.DEFAULT_OVERLAP,
      });

      return processResponse;
    } catch (error) {
      console.error('Failed to process document:', error);
      return {
        status: ProcessingStatus.FAILED,
        chunks: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 获取处理进度
  public async getProcessingProgress(documentId: string): Promise<ProcessingResult> {
    try {
      const response = await apiClient.get<ProcessingResult>(`/api/documents/${documentId}/progress`);
      return response;
    } catch (error) {
      console.error('Failed to get processing progress:', error);
      return {
        status: ProcessingStatus.FAILED,
        chunks: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 向量化文档块
  public async vectorizeChunks(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    try {
      const config = modelConfigManager.getCurrentConfig();
      const response = await apiClient.post<{ chunks: DocumentChunk[] }>('/api/documents/vectorize', {
        chunks,
        model: config.model,
      });
      return response.chunks;
    } catch (error) {
      console.error('Failed to vectorize chunks:', error);
      throw error;
    }
  }

  // 搜索相似文档块
  public async searchSimilarChunks(query: string, limit: number = 5): Promise<DocumentChunk[]> {
    try {
      const config = modelConfigManager.getCurrentConfig();
      const response = await apiClient.post<{ chunks: DocumentChunk[] }>('/api/documents/search', {
        query,
        limit,
        model: config.model,
      });
      return response.chunks;
    } catch (error) {
      console.error('Failed to search similar chunks:', error);
      throw error;
    }
  }

  // 验证文件
  private validateFile(file: File): boolean {
    // 检查文件大小
    if (file.size > DOCUMENT_CONFIG.MAX_FILE_SIZE) {
      return false;
    }

    // 检查文件类型
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    return fileExtension ? DOCUMENT_CONFIG.ALL_SUPPORTED_TYPES.includes(fileExtension) : false;
  }

  // 获取文档块
  public async getDocumentChunks(documentId: string): Promise<DocumentChunk[]> {
    try {
      const response = await apiClient.get<{ chunks: DocumentChunk[] }>(`/api/documents/${documentId}/chunks`);
      return response.chunks;
    } catch (error) {
      console.error('Failed to get document chunks:', error);
      throw error;
    }
  }

  // 更新文档块
  public async updateDocumentChunk(chunkId: string, updates: Partial<DocumentChunk>): Promise<DocumentChunk> {
    try {
      const response = await apiClient.put<{ chunk: DocumentChunk }>(`/api/documents/chunks/${chunkId}`, updates);
      return response.chunk;
    } catch (error) {
      console.error('Failed to update document chunk:', error);
      throw error;
    }
  }

  // 删除文档块
  public async deleteDocumentChunk(chunkId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/documents/chunks/${chunkId}`);
    } catch (error) {
      console.error('Failed to delete document chunk:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const documentProcessor = DocumentProcessor.getInstance(); 