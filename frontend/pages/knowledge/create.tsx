import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  SimpleGrid,
  Divider,
  Progress,
  useToast,
  IconButton,
  Card,
  CardHeader,
  CardBody,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  StepTitle,
  StepDescription,
  StepSeparator,
  useSteps,
  Switch,
  Badge,
  Flex,
  Spacer,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Radio,
  RadioGroup,
  Stack,
  Checkbox,
  CheckboxGroup,
  Tooltip,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import {
  FiArrowLeft,
  FiUpload,
  FiFile,
  FiX,
  FiCheck,
  FiExternalLink,
  FiSettings,
  FiDatabase,
  FiInfo,
  FiFileText,
  FiGlobe,
  FiCpu,
  FiZap,
  FiBarChart,
} from 'react-icons/fi';
import { Layout } from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { knowledgeApi } from '../../services/api';
import type { CreateKnowledgeBaseParams, KnowledgeBase } from '../../types';

const steps = [
  { 
    title: '选择数据源', 
    description: '上传文档或连接外部数据源',
    icon: FiUpload 
  },
  { 
    title: '文本分段与清洗', 
    description: '配置文本处理和分段参数',
    icon: FiSettings 
  },
  { 
    title: '处理并完成', 
    description: '处理文档并创建知识库',
    icon: FiCheck 
  },
];

// LangChain支持的文本分割器类型
const TEXT_SPLITTERS = {
  recursive: {
    name: '递归字符分割器',
    description: '智能按段落、句子、词语递归分割，保持文本结构',
    recommended: true,
    separators: ['\\n\\n', '\\n', ' ', ''],
  },
  character: {
    name: '字符分割器',
    description: '按固定字符数分割，简单直接',
    recommended: false,
    separators: [''],
  },
  token: {
    name: 'Token分割器',
    description: '按Token数量分割，适合LLM处理',
    recommended: false,
    separators: [],
  },
  markdown: {
    name: 'Markdown分割器',
    description: '专门处理Markdown格式文档',
    recommended: false,
    separators: ['\\n## ', '\\n### ', '\\n\\n', '\\n', ' ', ''],
  },
  python: {
    name: 'Python代码分割器',
    description: '专门处理Python代码文件',
    recommended: false,
    separators: ['\\nclass ', '\\ndef ', '\\n\\n', '\\n', ' ', ''],
  },
  html: {
    name: 'HTML分割器',
    description: '专门处理HTML文档',
    recommended: false,
    separators: ['<div>', '<p>', '<br>', '\\n', ' ', ''],
  },
};

// 清洗规则选项
const CLEANING_RULES = [
  {
    key: 'remove_extra_whitespace',
    name: '移除多余空白',
    description: '清理文档中的多余空格、制表符和换行符',
    default: true,
  },
  {
    key: 'remove_urls_emails',
    name: '移除URL和邮箱',
    description: '自动识别并移除文档中的网址和邮箱地址',
    default: false,
  },
  {
    key: 'normalize_unicode',
    name: '标准化Unicode',
    description: '统一Unicode字符编码，避免编码问题',
    default: true,
  },
  {
    key: 'remove_special_chars',
    name: '移除特殊字符',
    description: '清理可能影响处理的特殊字符和控制字符',
    default: false,
  },
  {
    key: 'preserve_structure',
    name: '保持文档结构',
    description: '尽可能保留原文档的段落和章节结构',
    default: true,
  },
];

const CreateKnowledgeBasePage: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 颜色主题
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // 表单状态
  const [createForm, setCreateForm] = useState<CreateKnowledgeBaseParams>({
    name: '',
    description: '',
    embedding_model: 'text-embedding-ada-002',
    retrieval_model: 'gpt-3.5-turbo',
    chunk_size: 1000,
    chunk_overlap: 200,
    indexing_technique: 'high_quality' as const,
    permission: 'private' as const,
  });

  // 高级分段配置状态
  const [segmentConfig, setSegmentConfig] = useState({
    splitter_type: 'recursive',
    chunk_size: 1000,
    chunk_overlap: 200,
    length_function: 'char_count', // char_count, token_count
    keep_separator: true,
    add_start_index: false,
    strip_whitespace: true,
    custom_separators: '',
    metadata_fields: ['source', 'page', 'chunk_index'],
    cleaning_rules: ['remove_extra_whitespace', 'normalize_unicode', 'preserve_structure'],
  });

  // 文件上传状态
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    currentFile: string;
    fileIndex: number;
    totalFiles: number;
    overallProgress: number;
    createdKnowledgeBase?: KnowledgeBase;
    isComplete: boolean;
  } | null>(null);

  // 估算分块数量 - 改进版本
  const estimateChunks = (file: File) => {
    // 根据文件类型调整字符估算比例
    let avgCharPerByte = 0.7; // 默认值
    const fileExt = file.name.toLowerCase().split('.').pop();
    
    switch (fileExt) {
      case 'pdf':
        avgCharPerByte = 0.5; // PDF文件通常包含更多元数据和格式信息
        break;
      case 'docx':
      case 'doc':
        avgCharPerByte = 0.4; // Word文档包含大量格式和元数据
        break;
      case 'txt':
      case 'md':
        avgCharPerByte = 0.9; // 纯文本文件字符密度高
        break;
      case 'html':
        avgCharPerByte = 0.3; // HTML包含大量标签
        break;
      default:
        avgCharPerByte = 0.7;
    }
    
    // 估算提取的文本字符数
    const estimatedTextChars = file.size * avgCharPerByte;
    
    // 考虑清洗规则的影响（可能会减少文本量）
    const cleaningReduction = segmentConfig.cleaning_rules.length > 0 ? 0.9 : 1.0;
    const effectiveTextChars = estimatedTextChars * cleaningReduction;
    
    // 计算有效分块大小（考虑重叠）
    const effectiveChunkSize = Math.max(100, segmentConfig.chunk_size - segmentConfig.chunk_overlap);
    
    // 估算分块数量
    const estimatedChunks = Math.ceil(effectiveTextChars / effectiveChunkSize);
    
    return {
      estimatedChunks,
      estimatedTextChars: Math.round(effectiveTextChars),
      effectiveChunkSize,
      fileType: fileExt || 'unknown'
    };
  };

  // 估算处理时间
  const estimateProcessingTime = () => {
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const sizeMB = totalSize / (1024 * 1024);
    return Math.max(1, Math.ceil(sizeMB * 0.5)); // 每MB约0.5分钟
  };

  // 文件选择处理
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  // 移除文件
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 下一步
  const handleNext = () => {
    // 验证当前步骤
    if (activeStep === 0) {
      if (selectedFiles.length === 0) {
        toast({
          title: '请选择文档',
          description: '至少需要上传一个文档文件',
          status: 'warning',
          duration: 3000,
        });
        return;
      }
    }
    
    if (activeStep === 1) {
      if (!createForm.name.trim()) {
        toast({
          title: '请填写知识库名称',
          status: 'warning',
          duration: 3000,
        });
        return;
      }
    }
    
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  // 上一步
  const handlePrev = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  // 创建知识库
  const handleCreate = async () => {
    try {
      setCreating(true);
      setUploadProgress({
        currentFile: '',
        fileIndex: 0,
        totalFiles: selectedFiles.length,
        overallProgress: 0,
        isComplete: false,
      });

      // 准备创建参数，合并分段配置
      const createParams = {
        ...createForm,
        chunk_size: segmentConfig.chunk_size,
        chunk_overlap: segmentConfig.chunk_overlap,
        // 将分段配置传递给后端
        segmentation_config: segmentConfig,
      };
      
      // 创建知识库
      const response = await knowledgeApi.createKnowledgeBase(createParams);
      const newKnowledgeBase = response.data.data;

      setUploadProgress(prev => prev ? {
        ...prev,
        createdKnowledgeBase: newKnowledgeBase,
      } : null);

      // 上传文档
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        setUploadProgress(prev => prev ? {
          ...prev,
          currentFile: file.name,
          fileIndex: i + 1,
          overallProgress: (i / selectedFiles.length) * 100,
        } : null);

        try {
          await knowledgeApi.uploadDocument({
            knowledge_base_id: newKnowledgeBase.id,
            file,
          });
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          toast({
            title: `文件 "${file.name}" 上传失败`,
            description: error instanceof Error ? error.message : '未知错误',
            status: 'error',
            duration: 5000,
          });
        }
      }

      // 完成上传
      setUploadProgress(prev => prev ? {
        ...prev,
        currentFile: '',
        overallProgress: 100,
        isComplete: true,
      } : null);

      toast({
        title: '知识库创建完成',
        description: `知识库 "${createForm.name}" 已创建，共处理 ${selectedFiles.length} 个文档`,
        status: 'success',
        duration: 5000,
      });
    } catch (error) {
      console.error('Failed to create knowledge base:', error);
      toast({
        title: '创建失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
      });
      setUploadProgress(null);
    } finally {
      if (!uploadProgress?.isComplete) {
        setCreating(false);
      }
    }
  };

  // 查看知识库详情
  const handleViewKnowledgeBase = () => {
    if (uploadProgress?.createdKnowledgeBase) {
      router.push(`/knowledge/${uploadProgress.createdKnowledgeBase.id}`);
    }
  };

  // 返回列表
  const handleBackToList = () => {
    router.push('/');
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    const StepIcon = steps[activeStep].icon;
    
    switch (activeStep) {
      case 0:
        return (
          <VStack spacing={8} align="stretch">
            {/* 步骤标题 */}
            <Box textAlign="center">
              <StepIcon size={24} color="blue" style={{ margin: '0 auto' }} />
              <Heading size="md" mt={3} mb={2}>选择数据源</Heading>
              <Text color="gray.600" fontSize="md">
                支持多种文档格式，智能解析文档内容
              </Text>
            </Box>

            {/* 文件上传区域 */}
            <Card>
              <CardBody>
                <VStack spacing={4}>
                  <Button
                    leftIcon={<FiUpload size={16} />}
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    w="full"
                    h="80px"
                    borderStyle="dashed"
                    borderWidth="2px"
                    borderColor="blue.300"
                    _hover={{ 
                      bg: "blue.50",
                      borderColor: "blue.400"
                    }}
                    size="md"
                    fontSize="md"
                  >
                    <VStack spacing={1}>
                      <Text>点击选择文件</Text>
                      <Text fontSize="sm" color="gray.500">
                        支持 PDF、DOC、DOCX、TXT、MD、HTML 等格式
                      </Text>
                    </VStack>
                  </Button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.md,.html,.py,.js,.ts,.json,.csv"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />

                  <Alert status="info" borderRadius="md" py={3}>
                    <AlertIcon boxSize={4} />
                    <Box>
                      <AlertTitle fontSize="sm">支持的文件格式</AlertTitle>
                      <AlertDescription fontSize="sm">
                        文档类：PDF、DOC、DOCX、TXT、MD、HTML<br/>
                        代码类：PY、JS、TS、JSON、CSV<br/>
                        单个文件最大 50MB，总计最大 500MB
                      </AlertDescription>
                    </Box>
                  </Alert>
                </VStack>
              </CardBody>
            </Card>

            {/* 已选文件列表 */}
            {selectedFiles.length > 0 && (
              <Card>
                <CardHeader py={3}>
                  <HStack>
                    <FiFile size={16} />
                    <Text fontWeight="bold" fontSize="md">
                      已选择文件 ({selectedFiles.length})
                    </Text>
                    <Spacer />
                    <Badge colorScheme="blue" fontSize="xs">
                      总大小: {formatFileSize(selectedFiles.reduce((sum, f) => sum + f.size, 0))}
                    </Badge>
                  </HStack>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack spacing={2} align="stretch">
                    {selectedFiles.map((file, index) => (
                      <HStack
                        key={index}
                        p={3}
                        bg="gray.50"
                        borderRadius="md"
                        border="1px solid"
                        borderColor={borderColor}
                        spacing={3}
                      >
                        <FiFileText size={14} color="blue" />
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                            {file.name}
                          </Text>
                          <HStack spacing={3} fontSize="xs" color="gray.500">
                            <Text>{formatFileSize(file.size)}</Text>
                            <Text>•</Text>
                            <Text>预估 {estimateChunks(file).estimatedChunks} 个分块</Text>
                            <Text>•</Text>
                            <Text>{Math.round(estimateChunks(file).estimatedTextChars / 1000)}k 字符</Text>
                          </HStack>
                        </VStack>
                        <IconButton
                          aria-label="Remove file"
                          icon={<FiX size={12} />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => removeFile(index)}
                        />
                      </HStack>
                    ))}
                  </VStack>
                </CardBody>
              </Card>
            )}
          </VStack>
        );

      case 1:
        return (
          <VStack spacing={8} align="stretch">
            {/* 步骤标题 */}
            <Box textAlign="center">
              <StepIcon size={24} color="blue" style={{ margin: '0 auto' }} />
              <Heading size="md" mt={3} mb={2}>文本分段与清洗</Heading>
              <Text color="gray.600" fontSize="md">
                配置文本处理参数，优化知识库质量
              </Text>
            </Box>

            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
              {/* 基本信息 */}
              <Card>
                <CardHeader py={3}>
                  <HStack>
                    <FiDatabase size={16} />
                    <Text fontWeight="bold" fontSize="md">基本信息</Text>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel fontSize="sm">知识库名称</FormLabel>
                      <Input
                        size="sm"
                        value={createForm.name}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, name: e.target.value })
                        }
                        placeholder="输入知识库名称"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">描述</FormLabel>
                      <Textarea
                        size="sm"
                        value={createForm.description}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, description: e.target.value })
                        }
                        placeholder="输入知识库描述（可选）"
                        rows={3}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">权限设置</FormLabel>
                      <RadioGroup
                        value={createForm.permission}
                        onChange={(value) =>
                          setCreateForm({
                            ...createForm,
                            permission: value as 'private' | 'public',
                          })
                        }
                      >
                        <Stack direction="column" spacing={2}>
                          <Radio value="private" size="sm">
                            <HStack>
                              <Text fontSize="sm">私有</Text>
                              <Text fontSize="xs" color="gray.500">仅自己可见</Text>
                            </HStack>
                          </Radio>
                          <Radio value="public" size="sm">
                            <HStack>
                              <Text fontSize="sm">公开</Text>
                              <Text fontSize="xs" color="gray.500">所有人可见</Text>
                            </HStack>
                          </Radio>
                        </Stack>
                      </RadioGroup>
                    </FormControl>
                  </VStack>
                </CardBody>
              </Card>

              {/* 文本分割器配置 */}
              <Card>
                <CardHeader py={3}>
                  <HStack>
                    <FiCpu size={16} />
                    <Text fontWeight="bold" fontSize="md">文本分割器</Text>
                    <Tooltip label="选择适合的文本分割算法">
                      <Box>
                        <FiInfo size={14} color="gray" />
                      </Box>
                    </Tooltip>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">分割器类型</FormLabel>
                      <Select
                        size="sm"
                        value={segmentConfig.splitter_type}
                        onChange={(e) =>
                          setSegmentConfig({ ...segmentConfig, splitter_type: e.target.value })
                        }
                      >
                        {Object.entries(TEXT_SPLITTERS).map(([key, splitter]) => (
                          <option key={key} value={key}>
                            {splitter.name} {splitter.recommended ? '(推荐)' : ''}
                          </option>
                        ))}
                      </Select>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        {TEXT_SPLITTERS[segmentConfig.splitter_type as keyof typeof TEXT_SPLITTERS]?.description}
                      </Text>
                    </FormControl>

                    <SimpleGrid columns={2} spacing={4}>
                      <FormControl>
                        <FormLabel fontSize="sm">分块大小</FormLabel>
                        <NumberInput
                          size="sm"
                          value={segmentConfig.chunk_size}
                          onChange={(_, value) =>
                            setSegmentConfig({ ...segmentConfig, chunk_size: value || 1000 })
                          }
                          min={100}
                          max={8000}
                          step={100}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <Text fontSize="xs" color="gray.500">字符数</Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">重叠大小</FormLabel>
                        <NumberInput
                          size="sm"
                          value={segmentConfig.chunk_overlap}
                          onChange={(_, value) =>
                            setSegmentConfig({ ...segmentConfig, chunk_overlap: value || 200 })
                          }
                          min={0}
                          max={Math.floor(segmentConfig.chunk_size * 0.5)}
                          step={50}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <Text fontSize="xs" color="gray.500">字符数</Text>
                      </FormControl>
                    </SimpleGrid>

                    <FormControl>
                      <FormLabel fontSize="sm">长度计算方式</FormLabel>
                      <RadioGroup
                        value={segmentConfig.length_function}
                        onChange={(value) =>
                          setSegmentConfig({ ...segmentConfig, length_function: value })
                        }
                      >
                        <Stack direction="column" spacing={2}>
                          <Radio value="char_count" size="sm">
                            <Text fontSize="sm">字符计数 (推荐)</Text>
                          </Radio>
                          <Radio value="token_count" size="sm">
                            <Text fontSize="sm">Token计数</Text>
                          </Radio>
                        </Stack>
                      </RadioGroup>
                    </FormControl>
                  </VStack>
                </CardBody>
              </Card>

              {/* 清洗规则 */}
              <Card>
                <CardHeader py={3}>
                  <HStack>
                    <FiZap size={16} />
                    <Text fontWeight="bold" fontSize="md">文本清洗规则</Text>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <CheckboxGroup
                    value={segmentConfig.cleaning_rules}
                    onChange={(values) =>
                      setSegmentConfig({ ...segmentConfig, cleaning_rules: values as string[] })
                    }
                  >
                    <VStack spacing={3} align="stretch">
                      {CLEANING_RULES.map((rule) => (
                        <Checkbox key={rule.key} value={rule.key} size="sm">
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="medium">
                              {rule.name}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {rule.description}
                            </Text>
                          </VStack>
                        </Checkbox>
                      ))}
                    </VStack>
                  </CheckboxGroup>
                </CardBody>
              </Card>

              {/* 高级选项 */}
              <Card>
                <CardHeader py={3}>
                  <HStack>
                    <FiSettings size={16} />
                    <Text fontWeight="bold" fontSize="md">高级选项</Text>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    <HStack justify="space-between" w="full">
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontSize="sm" fontWeight="medium">保留分隔符</Text>
                        <Text fontSize="xs" color="gray.500">在分块中保留原始分隔符</Text>
                      </VStack>
                      <Switch
                        size="sm"
                        isChecked={segmentConfig.keep_separator}
                        onChange={(e) =>
                          setSegmentConfig({ ...segmentConfig, keep_separator: e.target.checked })
                        }
                      />
                    </HStack>

                    <HStack justify="space-between" w="full">
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontSize="sm" fontWeight="medium">添加起始索引</Text>
                        <Text fontSize="xs" color="gray.500">为每个分块添加起始位置信息</Text>
                      </VStack>
                      <Switch
                        size="sm"
                        isChecked={segmentConfig.add_start_index}
                        onChange={(e) =>
                          setSegmentConfig({ ...segmentConfig, add_start_index: e.target.checked })
                        }
                      />
                    </HStack>

                    <HStack justify="space-between" w="full">
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontSize="sm" fontWeight="medium">去除空白字符</Text>
                        <Text fontSize="xs" color="gray.500">自动清理首尾空白字符</Text>
                      </VStack>
                      <Switch
                        size="sm"
                        isChecked={segmentConfig.strip_whitespace}
                        onChange={(e) =>
                          setSegmentConfig({ ...segmentConfig, strip_whitespace: e.target.checked })
                        }
                      />
                    </HStack>

                    <FormControl>
                      <FormLabel fontSize="sm">自定义分隔符</FormLabel>
                      <Input
                        size="sm"
                        value={segmentConfig.custom_separators}
                        onChange={(e) =>
                          setSegmentConfig({ ...segmentConfig, custom_separators: e.target.value })
                        }
                        placeholder="输入自定义分隔符，用逗号分隔"
                      />
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        例如：\\n\\n,\\n,。,！,？
                      </Text>
                    </FormControl>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* 配置预览 */}
            <Alert status="info" borderRadius="md" py={3}>
              <AlertIcon boxSize={4} />
              <Box>
                <AlertTitle fontSize="sm">配置预览</AlertTitle>
                <AlertDescription>
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mt={2}>
                    <Text fontSize="xs">
                      <strong>分块大小:</strong> {segmentConfig.chunk_size} 字符
                    </Text>
                    <Text fontSize="xs">
                      <strong>重叠大小:</strong> {segmentConfig.chunk_overlap} 字符
                    </Text>
                    <Text fontSize="xs">
                      <strong>有效分块:</strong> {segmentConfig.chunk_size - segmentConfig.chunk_overlap} 字符
                    </Text>
                    <Text fontSize="xs">
                      <strong>重叠比例:</strong> {((segmentConfig.chunk_overlap / segmentConfig.chunk_size) * 100).toFixed(1)}%
                    </Text>
                  </SimpleGrid>
                </AlertDescription>
              </Box>
            </Alert>
          </VStack>
        );

      case 2:
        return (
          <VStack spacing={8} align="stretch">
            {/* 步骤标题 */}
            <Box textAlign="center">
              <StepIcon size={24} color="green" style={{ margin: '0 auto' }} />
              <Heading size="md" mt={3} mb={2}>处理并完成</Heading>
              <Text color="gray.600" fontSize="md">
                确认配置并开始处理文档
              </Text>
            </Box>

            {/* 配置总结 */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Card>
                <CardHeader py={3}>
                  <Text fontWeight="bold" fontSize="md">知识库信息</Text>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.500">名称</Text>
                      <Text fontSize="sm" fontWeight="medium">{createForm.name || '未设置'}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.500">权限</Text>
                      <Badge colorScheme={createForm.permission === 'public' ? 'green' : 'orange'} fontSize="xs">
                        {createForm.permission === 'public' ? '公开' : '私有'}
                      </Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.500">文档数量</Text>
                      <Text fontSize="sm" fontWeight="medium">{selectedFiles.length} 个</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.500">总大小</Text>
                      <Text fontSize="sm" fontWeight="medium">
                        {formatFileSize(selectedFiles.reduce((sum, f) => sum + f.size, 0))}
                      </Text>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardHeader py={3}>
                  <Text fontWeight="bold" fontSize="md">处理配置</Text>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.500">分割器</Text>
                      <Text fontSize="sm" fontWeight="medium">
                        {TEXT_SPLITTERS[segmentConfig.splitter_type as keyof typeof TEXT_SPLITTERS]?.name}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.500">分块大小</Text>
                      <Text fontSize="sm" fontWeight="medium">{segmentConfig.chunk_size} 字符</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.500">重叠大小</Text>
                      <Text fontSize="sm" fontWeight="medium">{segmentConfig.chunk_overlap} 字符</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.500">清洗规则</Text>
                      <Text fontSize="sm" fontWeight="medium">{segmentConfig.cleaning_rules.length} 项</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.500">预计分块</Text>
                      <Text fontSize="sm" fontWeight="medium">
                        约 {selectedFiles.reduce((sum, file) => sum + estimateChunks(file).estimatedChunks, 0)} 个
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.500">预计时间</Text>
                      <Text fontSize="sm" fontWeight="medium">{estimateProcessingTime()} 分钟</Text>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* 处理提示 */}
            <Alert status="warning" borderRadius="md" py={3}>
              <AlertIcon boxSize={4} />
              <Box>
                <AlertTitle fontSize="sm">处理说明</AlertTitle>
                <AlertDescription fontSize="sm">
                  • 文档处理可能需要几分钟时间，请耐心等待<br/>
                  • 处理过程中请不要关闭页面<br/>
                  • 处理完成后可以在知识库详情页查看分段结果
                </AlertDescription>
              </Box>
            </Alert>
          </VStack>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <Box bg={bgColor} minH="100vh">
        <Container maxW="6xl" py={8}>
          {/* 面包屑导航 */}
          <Breadcrumb mb={6}>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={handleBackToList}>知识库</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink>新建知识库</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>

          {/* 页面标题 */}
          <HStack justify="space-between" align="center" mb={8}>
            <VStack align="start" spacing={2}>
              <Heading size="xl">创建知识库</Heading>
              <Text color="gray.600" fontSize="lg">
                通过智能文档处理，构建高质量的知识库
              </Text>
            </VStack>
            <Button
              leftIcon={<FiArrowLeft />}
              variant="outline"
              onClick={handleBackToList}
            >
              返回列表
            </Button>
          </HStack>

          {/* 上传进度显示 */}
          {uploadProgress && (
            <Card mb={8} borderColor="blue.200" borderWidth="2px" bg={cardBg}>
              <CardBody>
                <VStack spacing={4}>
                  <HStack w="full" justify="space-between">
                    <Text fontWeight="bold" color="blue.800" fontSize="lg">
                      {uploadProgress.isComplete ? '🎉 知识库创建完成！' : '⚙️ 正在处理文档...'}
                    </Text>
                    <Text fontSize="sm" color="blue.600">
                      {uploadProgress.fileIndex}/{uploadProgress.totalFiles}
                    </Text>
                  </HStack>

                  <Box w="full">
                    <Progress 
                      value={uploadProgress.overallProgress} 
                      colorScheme="blue" 
                      size="lg" 
                      borderRadius="md"
                      hasStripe={!uploadProgress.isComplete}
                      isAnimated={!uploadProgress.isComplete}
                    />
                    <HStack justify="space-between" mt={2}>
                      <Text fontSize="sm" color="blue.600">
                        {uploadProgress.currentFile && !uploadProgress.isComplete 
                          ? `正在处理: ${uploadProgress.currentFile}`
                          : uploadProgress.isComplete 
                          ? '所有文档已成功处理并索引'
                          : '准备开始处理...'}
                      </Text>
                      <Text fontSize="sm" color="blue.600" fontWeight="bold">
                        {Math.round(uploadProgress.overallProgress)}%
                      </Text>
                    </HStack>
                  </Box>

                  {uploadProgress.isComplete && uploadProgress.createdKnowledgeBase && (
                    <HStack spacing={3} w="full" pt={4}>
                      <Button
                        colorScheme="blue"
                        size="lg"
                        leftIcon={<FiExternalLink />}
                        onClick={handleViewKnowledgeBase}
                        flex={1}
                      >
                        查看知识库详情
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleBackToList}
                        flex={1}
                      >
                        返回列表
                      </Button>
                    </HStack>
                  )}
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* 步骤导航 */}
          {!uploadProgress && (
            <Card mb={8} bg={cardBg}>
              <CardBody p={8}>
                <Stepper index={activeStep} orientation="horizontal" height="140px" gap="0">
                  {steps.map((step, index) => (
                    <Step key={index}>
                      <StepIndicator>
                        <StepStatus
                          complete={<StepIcon />}
                          incomplete={<StepNumber />}
                          active={<StepNumber />}
                        />
                      </StepIndicator>

                      <Box flexShrink="0">
                        <StepTitle>{step.title}</StepTitle>
                        <StepDescription>{step.description}</StepDescription>
                      </Box>

                      <StepSeparator />
                    </Step>
                  ))}
                </Stepper>
              </CardBody>
            </Card>
          )}

          {/* 步骤内容 */}
          {!uploadProgress && (
            <Card bg={cardBg}>
              <CardBody p={8}>
                {renderStepContent()}
              </CardBody>
            </Card>
          )}

          {/* 预估信息总览 */}
          {selectedFiles.length > 0 && (
            <Card>
              <CardHeader py={3}>
                <HStack>
                  <FiBarChart size={16} />
                  <Text fontWeight="bold" fontSize="md">处理预估</Text>
                </HStack>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                  <Stat size="sm">
                    <StatLabel fontSize="xs">总文件数</StatLabel>
                    <StatNumber fontSize="lg">{selectedFiles.length}</StatNumber>
                  </Stat>
                  <Stat size="sm">
                    <StatLabel fontSize="xs">预计文本量</StatLabel>
                    <StatNumber fontSize="lg">
                      {Math.round(selectedFiles.reduce((sum, file) => sum + estimateChunks(file).estimatedTextChars, 0) / 1000)}k
                    </StatNumber>
                    <StatHelpText fontSize="xs">字符</StatHelpText>
                  </Stat>
                  <Stat size="sm">
                    <StatLabel fontSize="xs">预计分块</StatLabel>
                    <StatNumber fontSize="lg">
                      {selectedFiles.reduce((sum, file) => sum + estimateChunks(file).estimatedChunks, 0)}
                    </StatNumber>
                    <StatHelpText fontSize="xs">个</StatHelpText>
                  </Stat>
                  <Stat size="sm">
                    <StatLabel fontSize="xs">处理时间</StatLabel>
                    <StatNumber fontSize="lg">{estimateProcessingTime()}</StatNumber>
                    <StatHelpText fontSize="xs">分钟</StatHelpText>
                  </Stat>
                </SimpleGrid>
                
                <Alert status="info" mt={4} borderRadius="md" py={3}>
                  <AlertIcon boxSize={4} />
                  <Box>
                    <AlertDescription fontSize="sm">
                      预估基于文件类型和大小计算，实际结果可能因文档内容而有所差异。
                      分块大小: {segmentConfig.chunk_size} 字符，重叠: {segmentConfig.chunk_overlap} 字符
                    </AlertDescription>
                  </Box>
                </Alert>
              </CardBody>
            </Card>
          )}

          {/* 操作按钮 */}
          {!uploadProgress && (
            <HStack justify="space-between" mt={8}>
              <Button
                variant="outline"
                onClick={handlePrev}
                isDisabled={activeStep === 0}
                size="lg"
              >
                上一步
              </Button>

              <HStack>
                {activeStep === steps.length - 1 ? (
                  <Button
                    colorScheme="blue"
                    onClick={handleCreate}
                    isLoading={creating}
                    loadingText="创建中..."
                    leftIcon={<FiCheck />}
                    size="lg"
                  >
                    开始创建知识库
                  </Button>
                ) : (
                  <Button
                    colorScheme="blue"
                    onClick={handleNext}
                    size="lg"
                  >
                    下一步
                  </Button>
                )}
              </HStack>
            </HStack>
          )}
        </Container>
      </Box>
    </Layout>
  );
};

export default function CreateKnowledgeBasePageWrapper() {
  return (
    <ProtectedRoute>
      <CreateKnowledgeBasePage />
    </ProtectedRoute>
  );
} 