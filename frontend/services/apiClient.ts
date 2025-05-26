import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG } from '../config/env';

// 限流器类
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.waitForSlot();
    }

    this.requests.push(now);
  }
}

// 重试器类
class RetryHandler {
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly retryConditions: string[];

  constructor(maxRetries: number, retryDelay: number, retryConditions: string[]) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
    this.retryConditions = retryConditions;
  }

  async retry<T>(
    fn: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retryCount >= this.maxRetries) {
        throw error;
      }

      const axiosError = error as AxiosError;
      if (
        this.retryConditions.includes(axiosError.code || '') ||
        (axiosError.response && axiosError.response.status >= 500)
      ) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, retryCount)));
        return this.retry(fn, retryCount + 1);
      }

      throw error;
    }
  }
}

// API 客户端类
export class ApiClient {
  private client: AxiosInstance;
  private rateLimiter: RateLimiter;
  private retryHandler: RetryHandler;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.rateLimiter = new RateLimiter(
      API_CONFIG.RATE_LIMIT.MAX_REQUESTS,
      API_CONFIG.RATE_LIMIT.WINDOW_MS
    );

    this.retryHandler = new RetryHandler(
      API_CONFIG.RETRY.MAX_RETRIES,
      API_CONFIG.RETRY.RETRY_DELAY,
      API_CONFIG.RETRY.RETRY_CONDITIONS
    );

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 请求拦截器
    this.client.interceptors.request.use(
      async (config) => {
        // 等待限流器
        await this.rateLimiter.waitForSlot();

        // 添加认证头
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // 处理未认证错误
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // 通用请求方法
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    return this.retryHandler.retry(async () => {
      const response = await this.client.request<T>(config);
      return response.data;
    });
  }

  // GET 请求
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  // POST 请求
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  // PUT 请求
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  // DELETE 请求
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  // 上传文件
  async upload<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<T>({
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(progress);
        }
      },
    });
  }

  // 下载文件
  async download(url: string, filename: string): Promise<void> {
    const response = await this.client.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(link.href);
  }
}

// 创建单例实例
export const apiClient = new ApiClient(); 