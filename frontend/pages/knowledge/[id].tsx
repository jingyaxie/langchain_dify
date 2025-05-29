import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
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
  Spinner,
  Center,
  Flex,
  Spacer,
  List,
  ListItem,
  ListIcon,
  Divider,
  useColorModeValue,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiUpload,
  FiFile,
  FiX,
  FiFileText,
  FiInfo,
} from 'react-icons/fi';
import { Layout } from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { knowledgeApi } from '../../services/api';
import { KnowledgeBase, Document, DocumentChunk } from '../../types';
import { useAuth } from '../../components/AuthProvider';

const KnowledgeBaseDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const { isOpen: isUploadOpen, onOpen: onUploadOpen, onClose: onUploadClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // 颜色模式
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  // 状态管理
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentChunks, setDocumentChunks] = useState<Record<string, DocumentChunk[]>>({});
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [chunksLoading, setChunksLoading] = useState<Record<string, boolean>>({});
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
  });

  // 加载知识库详情
  const loadKnowledgeBase = async () => {
    if (!id || typeof id !== 'string') return;
    
    try {
      setLoading(true);
      const response = await knowledgeApi.getKnowledgeBase(id);
      const kb = response.data.data;
      setKnowledgeBase(kb);
      setEditForm({
        name: kb.name,
        description: kb.description || '',
      });
    } catch (error) {
      toast({
        title: '加载失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
      });
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  // 加载文档列表
  const loadDocuments = async () => {
    if (!id || typeof id !== 'string') return;
    
    try {
      setDocumentsLoading(true);
      const response = await knowledgeApi.listDocuments(id);
      setDocuments(response.data.data?.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setDocumentsLoading(false);
    }
  };

  // 加载文档分段
  const loadDocumentChunks = async (documentId: string) => {
    if (!id || typeof id !== 'string') return;
    
    try {
      setChunksLoading(prev => ({ ...prev, [documentId]: true }));
      const response = await knowledgeApi.listDocumentChunks(id, documentId);
      setDocumentChunks(prev => ({
        ...prev,
        [documentId]: response.data.data?.chunks || []
      }));
    } catch (error) {
      console.error('Failed to load document chunks:', error);
      toast({
        title: '加载分段失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setChunksLoading(prev => ({ ...prev, [documentId]: false }));
    }
  };

  // 文件上传处理
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ['pdf', 'docx', 'txt', 'md'].includes(ext || '');
    });
    
    if (validFiles.length !== files.length) {
      toast({
        title: '部分文件被忽略',
        description: '只支持PDF、DOCX、TXT、MD格式的文件',
        status: 'warning',
        duration: 3000,
      });
    }
    
    setUploadingFiles(validFiles);
  };

  // 上传文档
  const handleUploadDocuments = async () => {
    if (!id || typeof id !== 'string' || uploadingFiles.length === 0) return;

    try {
      setUploading(true);
      let successCount = 0;
      let failCount = 0;

      for (const file of uploadingFiles) {
        try {
          await knowledgeApi.uploadDocument({
            knowledge_base_id: id,
            file,
          });
          successCount++;
        } catch (error) {
          failCount++;
          console.error('Failed to upload file:', file.name, error);
        }
      }

      if (successCount > 0) {
        toast({
          title: `${successCount}个文档上传成功`,
          description: failCount > 0 ? `${failCount}个文档上传失败` : '',
          status: failCount > 0 ? 'warning' : 'success',
          duration: 5000,
        });
        loadDocuments();
        loadKnowledgeBase();
      }

      if (failCount > 0 && successCount === 0) {
        toast({
          title: '文档上传失败',
          status: 'error',
          duration: 5000,
        });
      }

      setUploadingFiles([]);
      onUploadClose();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: '上传失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setUploading(false);
    }
  };

  // 删除文档
  const handleDeleteDocument = async (docId: string) => {
    if (!id || typeof id !== 'string') return;

    try {
      await knowledgeApi.deleteDocument(id, docId);
      toast({
        title: '删除成功',
        status: 'success',
        duration: 3000,
      });
      loadDocuments();
      loadKnowledgeBase();
      // 清除已加载的分段数据
      setDocumentChunks(prev => {
        const newChunks = { ...prev };
        delete newChunks[docId];
        return newChunks;
      });
    } catch (error) {
      toast({
        title: '删除失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
      });
    }
  };

  // 更新知识库
  const handleUpdateKnowledgeBase = async () => {
    if (!id || typeof id !== 'string' || !knowledgeBase) return;

    try {
      await knowledgeApi.updateKnowledgeBase(id, {
        name: editForm.name,
        description: editForm.description,
        embedding_model: knowledgeBase.embedding_model,
        retrieval_model: knowledgeBase.retrieval_model,
        chunk_size: knowledgeBase.chunk_size,
        chunk_overlap: knowledgeBase.chunk_overlap,
        indexing_technique: knowledgeBase.indexing_technique,
        permission: knowledgeBase.permission,
      });
      
      toast({
        title: '更新成功',
        status: 'success',
        duration: 3000,
      });
      
      onEditClose();
      loadKnowledgeBase();
    } catch (error) {
      toast({
        title: '更新失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
      });
    }
  };

  // 删除知识库
  const handleDeleteKnowledgeBase = async () => {
    if (!id || typeof id !== 'string') return;

    try {
      await knowledgeApi.deleteKnowledgeBase(id);
      toast({
        title: '删除成功',
        status: 'success',
        duration: 3000,
      });
      router.push('/');
    } catch (error) {
      toast({
        title: '删除失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
      });
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

  // 移除上传文件
  const removeUploadFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 检查权限
  const hasPermission = (requiredPermission: 'owner' | 'editor' | 'viewer') => {
    if (!currentUser || !knowledgeBase) return false;
    if (knowledgeBase.owner_id === currentUser.username) return true;
    if (knowledgeBase.permission === 'public') return true;
    return false;
  };

  useEffect(() => {
    if (id) {
      loadKnowledgeBase();
      loadDocuments();
    }
  }, [id]);

  if (loading) {
    return (
      <Center minH="50vh">
        <VStack>
          <Spinner size="lg" />
          <Text>加载中...</Text>
        </VStack>
      </Center>
    );
  }

  if (!knowledgeBase) {
    return (
      <Center minH="50vh">
        <VStack spacing={4}>
          <Text fontSize="lg">知识库不存在</Text>
          <Button leftIcon={<FiArrowLeft />} onClick={() => router.push('/')}>
            返回首页
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={6} maxW="1200px" mx="auto">
      {/* Header */}
      <Flex mb={6} alignItems="center">
        <HStack spacing={4}>
          <IconButton
            aria-label="Back"
            icon={<FiArrowLeft />}
            variant="ghost"
            onClick={() => router.push('/')}
          />
          <VStack align="start" spacing={1}>
            <Heading size="lg">{knowledgeBase.name}</Heading>
            <Text color="gray.500">{knowledgeBase.description || '暂无描述'}</Text>
          </VStack>
        </HStack>
        <Spacer />
        <HStack spacing={2}>
          {hasPermission('editor') && (
            <Button leftIcon={<FiUpload />} colorScheme="blue" onClick={onUploadOpen}>
              上传文档
            </Button>
          )}
          {hasPermission('owner') && (
            <>
              <IconButton
                aria-label="Edit"
                icon={<FiEdit2 />}
                variant="ghost"
                onClick={onEditOpen}
              />
              <IconButton
                aria-label="Delete"
                icon={<FiTrash2 />}
                colorScheme="red"
                variant="ghost"
                onClick={onDeleteOpen}
              />
            </>
          )}
        </HStack>
      </Flex>

      {/* 统计信息 */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
        <Box bg={cardBg} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
          <Stat>
            <StatLabel>文档数量</StatLabel>
            <StatNumber>{knowledgeBase.document_count || 0}</StatNumber>
          </Stat>
        </Box>
        <Box bg={cardBg} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
          <Stat>
            <StatLabel>总词数</StatLabel>
            <StatNumber>{knowledgeBase.word_count || 0}</StatNumber>
          </Stat>
        </Box>
        <Box bg={cardBg} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
          <Stat>
            <StatLabel>状态</StatLabel>
            <StatNumber>
              <Badge colorScheme={knowledgeBase.status === 'active' ? 'green' : 'gray'}>
                {knowledgeBase.status === 'active' ? '活跃' : '已归档'}
              </Badge>
            </StatNumber>
          </Stat>
        </Box>
        <Box bg={cardBg} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
          <Stat>
            <StatLabel>权限</StatLabel>
            <StatNumber>
              <Badge colorScheme={knowledgeBase.permission === 'public' ? 'blue' : 'purple'}>
                {knowledgeBase.permission === 'public' ? '公开' : '私有'}
              </Badge>
            </StatNumber>
          </Stat>
        </Box>
      </SimpleGrid>

      {/* 文档分段内容 */}
      <Box bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor} p={6}>
        <Heading size="md" mb={4} display="flex" alignItems="center">
          <FiFileText style={{ marginRight: '8px' }} />
          文档分段内容
        </Heading>

        {documentsLoading ? (
          <Center py={10}>
            <VStack>
              <Spinner size="lg" />
              <Text>加载文档列表...</Text>
            </VStack>
          </Center>
        ) : documents.length === 0 ? (
          <Center py={10}>
            <VStack spacing={4}>
              <FiFile size={48} color="gray" />
              <VStack spacing={2}>
                <Text fontSize="lg" fontWeight="medium">暂无文档</Text>
                <Text color="gray.500">上传文档开始使用知识库</Text>
              </VStack>
              {hasPermission('editor') && (
                <Button leftIcon={<FiUpload />} colorScheme="blue" onClick={onUploadOpen}>
                  上传文档
                </Button>
              )}
            </VStack>
          </Center>
        ) : (
          <Accordion allowMultiple>
            {documents.map((doc) => (
              <AccordionItem key={doc.id} borderWidth="1px" borderRadius="md" mb={4}>
                <AccordionButton
                  onClick={() => {
                    if (!documentChunks[doc.id]) {
                      loadDocumentChunks(doc.id);
                    }
                  }}
                >
                  <Box flex="1" textAlign="left">
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium" fontSize="md">{doc.name}</Text>
                        <HStack spacing={4} fontSize="sm" color="gray.500">
                          <Text>{formatFileSize(doc.size)}</Text>
                          <Text>{doc.chunk_count || 0} 分段</Text>
                          <Text>{doc.word_count || 0} 词</Text>
                          <Badge colorScheme={doc.status === 'completed' ? 'green' : 'yellow'} size="sm">
                            {doc.status === 'completed' ? '已完成' : '处理中'}
                          </Badge>
                        </HStack>
                      </VStack>
                      <VStack align="end" spacing={1}>
                        <HStack spacing={2} fontSize="xs" color="gray.500">
                          <Text>分块设置:</Text>
                          <Text>{knowledgeBase.chunk_size}字符</Text>
                          <Text>重叠{knowledgeBase.chunk_overlap}</Text>
                        </HStack>
                        {doc.chunk_count && (
                          <HStack spacing={2} fontSize="xs" color="green.600">
                            <Text>✓ 实际分段: {doc.chunk_count}</Text>
                          </HStack>
                        )}
                      </VStack>
                      {hasPermission('editor') && (
                        <IconButton
                          aria-label="Delete document"
                          icon={<FiTrash2 />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(doc.id);
                          }}
                        />
                      )}
                    </HStack>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  {chunksLoading[doc.id] ? (
                    <Center py={6}>
                      <VStack>
                        <Spinner size="md" />
                        <Text fontSize="sm">加载分段中...</Text>
                      </VStack>
                    </Center>
                  ) : documentChunks[doc.id]?.length > 0 ? (
                    <VStack align="stretch" spacing={3}>
                      <Text fontSize="sm" color="gray.600" mb={2}>
                        共 {documentChunks[doc.id].length} 个分段
                      </Text>
                      {documentChunks[doc.id].map((chunk, index) => (
                        <Box
                          key={chunk.id || index}
                          bg={cardBg}
                          p={4}
                          borderRadius="md"
                          borderWidth="1px"
                          borderColor={borderColor}
                        >
                          <HStack justify="space-between" mb={2}>
                            <Text fontWeight="medium" fontSize="sm" color="blue.600">
                              分段 {chunk.chunk_index + 1 || index + 1}
                            </Text>
                            <HStack spacing={3} fontSize="xs" color="gray.500">
                              <Text>{chunk.word_count || 0} 词</Text>
                              <Text>{chunk.char_count || 0} 字符</Text>
                              {chunk.metadata?.chunk_size_used && (
                                <Text>实际块大小: {chunk.metadata.chunk_size_used}</Text>
                              )}
                              {chunk.metadata?.chunk_overlap_used && (
                                <Text>重叠: {chunk.metadata.chunk_overlap_used}</Text>
                              )}
                            </HStack>
                          </HStack>
                          <Box
                            bg={bgColor}
                            p={3}
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor={borderColor}
                            maxH="200px"
                            overflowY="auto"
                          >
                            <Text 
                              whiteSpace="pre-wrap" 
                              fontSize="sm"
                              lineHeight="1.6"
                            >
                              {chunk.content}
                            </Text>
                          </Box>
                        </Box>
                      ))}
                    </VStack>
                  ) : (
                    <Center py={6}>
                      <Text color="gray.500" fontSize="sm">
                        暂无分段数据
                      </Text>
                    </Center>
                  )}
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </Box>

      {/* 上传文档模态框 */}
      <Modal isOpen={isUploadOpen} onClose={onUploadClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>上传文档</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Box
                border="2px dashed"
                borderColor={uploadingFiles.length > 0 ? "blue.200" : borderColor}
                borderRadius="lg"
                p={6}
                textAlign="center"
                bg={uploadingFiles.length > 0 ? "blue.50" : bgColor}
                cursor="pointer"
                onClick={() => fileInputRef.current?.click()}
                _hover={{ borderColor: "blue.300", bg: "blue.50" }}
                transition="all 0.2s"
              >
                <Input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.md"
                  onChange={handleFileSelect}
                  display="none"
                />
                <VStack spacing={3}>
                  <FiUpload size={32} color="var(--chakra-colors-blue-400)" />
                  <VStack spacing={1}>
                    <Text fontWeight="medium">点击选择文档或拖拽到此处</Text>
                    <Text fontSize="sm" color="gray.500">
                      支持 PDF、DOCX、TXT、MD 格式，可选择多个文件
                    </Text>
                  </VStack>
                </VStack>
              </Box>

              {uploadingFiles.length > 0 && (
                <Box>
                  <Text fontWeight="medium" mb={2}>已选择 {uploadingFiles.length} 个文件：</Text>
                  <List spacing={2}>
                    {uploadingFiles.map((file, index) => (
                      <ListItem
                        key={index}
                        p={3}
                        bg={bgColor}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor={borderColor}
                      >
                        <HStack justify="space-between">
                          <HStack spacing={3}>
                            <ListIcon as={FiFile} color="blue.400" />
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                                {file.name}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {formatFileSize(file.size)}
                              </Text>
                            </VStack>
                          </HStack>
                          <IconButton
                            aria-label="Remove file"
                            icon={<FiX />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeUploadFile(index);
                            }}
                          />
                        </HStack>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onUploadClose}>
              取消
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleUploadDocuments}
              isLoading={uploading}
              isDisabled={uploadingFiles.length === 0}
            >
              上传 {uploadingFiles.length} 个文件
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 编辑知识库模态框 */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>编辑知识库</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>名称</FormLabel>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel>描述</FormLabel>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              取消
            </Button>
            <Button colorScheme="blue" onClick={handleUpdateKnowledgeBase}>
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 删除确认对话框 */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              删除知识库
            </AlertDialogHeader>
            <AlertDialogBody>
              确定要删除知识库 "{knowledgeBase.name}" 吗？此操作不可撤销，将删除所有相关文档和数据。
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                取消
              </Button>
              <Button colorScheme="red" onClick={handleDeleteKnowledgeBase} ml={3}>
                删除
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

// 创建包装组件以正确集成Layout和ProtectedRoute
export default function KnowledgeBaseDetailWrapper() {
  return (
    <Layout>
      <ProtectedRoute>
        <KnowledgeBaseDetail />
      </ProtectedRoute>
    </Layout>
  );
} 