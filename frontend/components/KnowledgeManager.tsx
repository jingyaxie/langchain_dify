import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
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
  Center,
  Spinner,
  Spacer,
  Flex,
  Tooltip,
  useColorModeValue,
  List,
  ListItem,
  ListIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Link,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiUpload,
  FiSearch,
  FiFile,
  FiUsers,
  FiClock,
  FiDatabase,
  FiSettings,
  FiCheck,
  FiX,
  FiEye,
  FiLock,
  FiGlobe,
  FiChevronDown,
  FiExternalLink,
} from 'react-icons/fi';

import { useAuth } from './AuthProvider';
import { knowledgeApi } from '../services/api';
import type {
  KnowledgeBase,
  CreateKnowledgeBaseParams,
  Document,
  SearchResult,
  IndexingProgress,
  SharedUser,
} from '../types';

// Extended SearchResult type for UI display
type ExtendedSearchResult = SearchResult & {
  knowledge_base_name?: string;
  knowledge_base_id?: string;
};

interface KnowledgeManagerProps {
  onKnowledgeBaseSelect?: (kb: KnowledgeBase) => void;
}

const KnowledgeManager: React.FC<KnowledgeManagerProps> = ({
  onKnowledgeBaseSelect,
}) => {
  // Hooks
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 颜色模式
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // 状态管理
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedBase, setSelectedBase] = useState<KnowledgeBase | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [indexingProgress, setIndexingProgress] = useState<IndexingProgress | null>(null);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  
  // 搜索相关状态
  const [searchResults, setSearchResults] = useState<ExtendedSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: 管理, 1: 搜索

  // 创建表单状态
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);

  // 文件上传处理
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  // 加载知识库列表
  const loadKnowledgeBases = async () => {
    try {
      setLoading(true);
      const response = await knowledgeApi.listKnowledgeBases();
      setKnowledgeBases(response.data.data?.knowledge_bases || []);
    } catch (error) {
      console.error('Failed to load knowledge bases:', error);
      toast({
        title: '加载失败',
        description: '无法加载知识库列表',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // 删除知识库
  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这个知识库吗？此操作不可撤销。')) {
      return;
    }

    try {
      await knowledgeApi.deleteKnowledgeBase(id);
      toast({
        title: '删除成功',
        status: 'success',
        duration: 3000,
      });
      await loadKnowledgeBases();
    } catch (error) {
      console.error('Failed to delete knowledge base:', error);
      toast({
        title: '删除失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
      });
    }
  };

  // 搜索知识库
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: '请输入搜索内容',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      setIsSearching(true);
      const searchRequests = knowledgeBases.map(kb => 
        knowledgeApi.search({
          knowledge_base_id: kb.id,
          query: searchQuery,
          limit: 5
        })
      );
      
      const responses = await Promise.allSettled(searchRequests);
      const allResults: ExtendedSearchResult[] = [];
      
      responses.forEach((response, index) => {
        if (response.status === 'fulfilled' && response.value.data.data?.results) {
          const kbResults = response.value.data.data.results.map((result: SearchResult) => ({
            ...result,
            knowledge_base_name: knowledgeBases[index].name,
            knowledge_base_id: knowledgeBases[index].id,
          }));
          allResults.push(...kbResults);
        }
      });
      
      setSearchResults(allResults);
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: '搜索失败',
        description: error instanceof Error ? error.message : '搜索服务暂时不可用',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSearching(false);
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 初始化加载
  useEffect(() => {
    // 添加标记避免重复加载
    let mounted = true;
    
    const loadData = async () => {
      if (!mounted) return;
      await loadKnowledgeBases();
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, []); // 移除不必要的依赖

  if (loading) {
    return (
      <Center h="200px">
        <Spinner size="lg" />
      </Center>
    );
  }

  return (
    <Box p={6}>
      <Tabs index={activeTab} onChange={setActiveTab}>
        <TabList>
          <Tab>
            <HStack>
              <FiDatabase />
              <Text>知识库管理</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <FiSearch />
              <Text>全局搜索</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* 知识库管理标签页 */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between">
                <Heading size="lg">我的知识库</Heading>
                <Button
                  leftIcon={<FiPlus />}
                  colorScheme="blue"
                  onClick={() => router.push('/knowledge/create')}
                >
                  新建知识库
                </Button>
              </HStack>

              {knowledgeBases.length === 0 ? (
                <Center py={10}>
                  <VStack spacing={4}>
                    <FiDatabase size={48} color="gray" />
                    <Text color="gray.500">还没有知识库</Text>
                    <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={() => router.push('/knowledge/create')}>
                      创建第一个知识库
                    </Button>
                  </VStack>
                </Center>
              ) : (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>名称</Th>
                      <Th>描述</Th>
                      <Th>文档数</Th>
                      <Th>权限</Th>
                      <Th>创建时间</Th>
                      <Th>操作</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {knowledgeBases.map((kb) => (
                      <Tr key={kb.id}>
                        <Td>
                          <HStack>
                            <NextLink href={`/knowledge/${kb.id}`} passHref>
                              <Link color="blue.500" fontWeight="medium" display="flex" alignItems="center">
                                {kb.name}
                                <FiExternalLink style={{ marginLeft: '4px', fontSize: '12px' }} />
                              </Link>
                            </NextLink>
                          </HStack>
                        </Td>
                        <Td>
                          <Text noOfLines={2}>{kb.description || '无描述'}</Text>
                        </Td>
                        <Td>{kb.document_count || 0}</Td>
                        <Td>
                          <Badge
                            colorScheme={kb.permission === 'public' ? 'green' : 'orange'}
                            variant="subtle"
                          >
                            {kb.permission === 'public' ? (
                              <HStack spacing={1}>
                                <FiGlobe size={12} />
                                <Text>公开</Text>
                              </HStack>
                            ) : (
                              <HStack spacing={1}>
                                <FiLock size={12} />
                                <Text>私有</Text>
                              </HStack>
                            )}
                          </Badge>
                        </Td>
                        <Td>{new Date(kb.created_at).toLocaleDateString()}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <Tooltip label="编辑">
                              <IconButton
                                aria-label="Edit"
                                icon={<FiEdit />}
                                size="sm"
                                variant="ghost"
                              />
                            </Tooltip>
                            <Tooltip label="删除">
                              <IconButton
                                aria-label="Delete"
                                icon={<FiTrash2 />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => handleDelete(kb.id)}
                              />
                            </Tooltip>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </VStack>
          </TabPanel>

          {/* 全局搜索标签页 */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Heading size="lg">全局搜索</Heading>
              
              <HStack>
                <Input
                  placeholder="输入搜索内容..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                  leftIcon={<FiSearch />}
                  colorScheme="blue"
                  onClick={handleSearch}
                  isLoading={isSearching}
                  loadingText="搜索中..."
                >
                  搜索
                </Button>
              </HStack>

              {searchResults.length > 0 && (
                <VStack spacing={4} align="stretch">
                  <Text fontWeight="medium">搜索结果 ({searchResults.length})</Text>
                  <Accordion allowMultiple>
                    {searchResults.map((result, index) => (
                      <AccordionItem key={index}>
                        <AccordionButton>
                          <Box flex="1" textAlign="left">
                            <Text fontWeight="medium">
                              相关度: {(result.score * 100).toFixed(1)}%
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              来源: {result.knowledge_base_name || '未知'}
                            </Text>
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel pb={4}>
                          <Text>{result.chunk.content}</Text>
                        </AccordionPanel>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </VStack>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default KnowledgeManager; 