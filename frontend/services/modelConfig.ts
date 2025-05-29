import { LLM_CONFIG } from '../config/env';
import { apiClient } from './apiClient';

// 模型提供商类型
export type ModelProvider = 'openai' | 'azure' | 'anthropic';

// 模型配置接口
export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  stop_sequences?: string[];
}

// 默认模型配置
const DEFAULT_CONFIG: ModelConfig = {
  provider: 'openai',
  model: LLM_CONFIG.OPENAI.DEFAULT_MODEL,
  temperature: 0.7,
  max_tokens: 2000,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};

// 模型配置管理类
export class ModelConfigManager {
  private static instance: ModelConfigManager;
  private configs: Map<string, ModelConfig> = new Map();
  private currentConfig: ModelConfig;

  private constructor() {
    this.currentConfig = { ...DEFAULT_CONFIG };
    this.loadConfigs();
  }

  public static getInstance(): ModelConfigManager {
    if (!ModelConfigManager.instance) {
      ModelConfigManager.instance = new ModelConfigManager();
    }
    return ModelConfigManager.instance;
  }

  // 加载配置
  private async loadConfigs() {
    try {
      const response = await apiClient.get<{ configs: ModelConfig[] }>('/api/models/configs');
      response.configs.forEach(config => {
        this.configs.set(config.model, config);
      });
    } catch (error) {
      console.error('Failed to load model configs:', error);
    }
  }

  // 获取当前配置
  public getCurrentConfig(): ModelConfig {
    return { ...this.currentConfig };
  }

  // 设置当前配置
  public setCurrentConfig(config: Partial<ModelConfig>) {
    this.currentConfig = { ...this.currentConfig, ...config };
    this.saveConfig();
  }

  // 保存配置
  private async saveConfig() {
    try {
      await apiClient.post('/api/models/configs', this.currentConfig);
    } catch (error) {
      console.error('Failed to save model config:', error);
    }
  }

  // 获取所有配置
  public getAllConfigs(): ModelConfig[] {
    return Array.from(this.configs.values());
  }

  // 获取特定模型的配置
  public getConfig(model: string): ModelConfig | undefined {
    return this.configs.get(model);
  }

  // 验证配置
  public validateConfig(config: ModelConfig): boolean {
    // 验证提供商
    if (!['openai', 'azure', 'anthropic'].includes(config.provider)) {
      return false;
    }

    // 验证模型名称
    const providerConfig = LLM_CONFIG[config.provider.toUpperCase() as keyof typeof LLM_CONFIG];
    if (!providerConfig) {
      return false;
    }

    // 验证参数范围
    if (
      config.temperature < 0 || config.temperature > 2 ||
      config.max_tokens < 1 || config.max_tokens > 4000 ||
      config.top_p < 0 || config.top_p > 1 ||
      config.frequency_penalty < -2 || config.frequency_penalty > 2 ||
      config.presence_penalty < -2 || config.presence_penalty > 2
    ) {
      return false;
    }

    return true;
  }

  // 获取提供商配置
  public getProviderConfig(provider: ModelProvider) {
    return LLM_CONFIG[provider.toUpperCase() as keyof typeof LLM_CONFIG];
  }

  // 获取可用的模型列表
  public getAvailableModels(provider: ModelProvider): string[] {
    const providerConfig = this.getProviderConfig(provider);
    if (!providerConfig) {
      return [];
    }

    // 这里可以根据不同提供商返回不同的模型列表
    switch (provider) {
      case 'openai':
        return [
          'gpt-3.5-turbo',
          'gpt-4',
          'text-embedding-ada-002',
        ];
      case 'azure':
        return [
          providerConfig.DEFAULT_MODEL || '',
          'EMBEDDING_MODEL' in providerConfig ? providerConfig.EMBEDDING_MODEL || '' : '',
        ].filter(Boolean);
      case 'anthropic':
        return [
          'claude-2',
          'claude-instant-1',
        ];
      default:
        return [];
    }
  }

  // 重置为默认配置
  public resetToDefault() {
    this.currentConfig = { ...DEFAULT_CONFIG };
    this.saveConfig();
  }
}

// 导出单例实例
export const modelConfigManager = ModelConfigManager.getInstance(); 