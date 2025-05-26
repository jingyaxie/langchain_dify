import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  useToast,
  Progress,
  Text,
  Badge,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { FiEdit2, FiTrash2, FiUpload, FiSearch } from 'react-icons/fi';
import { knowledgeApi } from '../services/api';
import { KnowledgeBase, Document, IndexingProgress, KnowledgeBaseListResponse, DocumentListResponse, IndexingProgressResponse } from '../types';
import { modelConfigManager } from '../services/modelConfig';
import { authApi } from '../services/auth';
import { User, SharedUser } from '../types';

export const KnowledgeManager: React.FC = () => {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedBase, setSelectedBase] = useState<KnowledgeBase | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [indexingProgress, setIndexingProgress] = useState<IndexingProgress | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [currentUser] = useState<User | null>(authApi.getStoredUser());

  // 加载知识库列表
  const loadKnowledgeBases = async () => {
    try {
      setLoading(true);
      const response = await knowledgeApi.listKnowledgeBases();
      setKnowledgeBases(response.data.knowledge_bases);
    } catch (error) {
      toast({
        title: '加载知识库失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // 加载文档列表
  const loadDocuments = async (baseId: string) => {
    try {
      setLoading(true);
      const response = await knowledgeApi.listDocuments(baseId);
      setDocuments(response.data.documents);
    } catch (error) {
      toast({
        title: '加载文档失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // 检查索引进度
  const checkIndexingProgress = async (baseId: string) => {
    try {
      const response = await knowledgeApi.getIndexingProgress(baseId);
      setIndexingProgress(response.data.progress);
      if (response.data.progress.status === 'processing') {
        setTimeout(() => checkIndexingProgress(baseId), 2000);
      }
    } catch (error) {
      console.error('Failed to check indexing progress:', error);
    }
  };

  // 创建知识库
  const handleCreateKnowledgeBase = async (data: any) => {
    try {
      await knowledgeApi.createKnowledgeBase(data);
      toast({
        title: '创建成功',
        status: 'success',
        duration: 3000,
      });
      onClose();
      loadKnowledgeBases();
    } catch (error) {
      toast({
        title: '创建失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
      });
    }
  };

  // 删除知识库
  const handleDeleteKnowledgeBase = async (id: string) => {
    if (window.confirm('确定要删除这个知识库吗？')) {
      try {
        await knowledgeApi.deleteKnowledgeBase(id);
        toast({
          title: '删除成功',
          status: 'success',
          duration: 3000,
        });
        loadKnowledgeBases();
      } catch (error) {
        toast({
          title: '删除失败',
          description: error instanceof Error ? error.message : '未知错误',
          status: 'error',
          duration: 5000,
        });
      }
    }
  };

  // 上传文档
  const handleUploadDocument = async (file: File) => {
    if (!selectedBase) return;
    try {
      await knowledgeApi.uploadDocument({
        knowledge_base_id: selectedBase.id,
        file,
      });
      toast({
        title: '上传成功',
        status: 'success',
        duration: 3000,
      });
      loadDocuments(selectedBase.id);
      checkIndexingProgress(selectedBase.id);
    } catch (error) {
      toast({
        title: '上传失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
      });
    }
  };

  // 加载共享用户
  const loadSharedUsers = async (knowledgeBaseId: string) => {
    try {
      const response = await knowledgeApi.listSharedUsers(knowledgeBaseId);
      setSharedUsers(response.data.data.users);
    } catch (error) {
      toast({
        title: '加载共享用户失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
      });
    }
  };

  // 分享知识库
  const handleShareKnowledgeBase = async (userId: string, permission: string) => {
    if (!selectedBase) return;
    try {
      await knowledgeApi.shareKnowledgeBase(selectedBase.id, userId, permission);
      toast({
        title: '分享成功',
        status: 'success',
        duration: 3000,
      });
      loadSharedUsers(selectedBase.id);
    } catch (error) {
      toast({
        title: '分享失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
      });
    }
  };

  // 更新权限
  const handleUpdatePermission = async (userId: string, permission: string) => {
    if (!selectedBase) return;
    try {
      await knowledgeApi.updatePermission(selectedBase.id, userId, permission);
      toast({
        title: '更新权限成功',
        status: 'success',
        duration: 3000,
      });
      loadSharedUsers(selectedBase.id);
    } catch (error) {
      toast({
        title: '更新权限失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
      });
    }
  };

  // 移除权限
  const handleRemovePermission = async (userId: string) => {
    if (!selectedBase) return;
    try {
      await knowledgeApi.removePermission(selectedBase.id, userId);
      toast({
        title: '移除权限成功',
        status: 'success',
        duration: 3000,
      });
      loadSharedUsers(selectedBase.id);
    } catch (error) {
      toast({
        title: '移除权限失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
      });
    }
  };

  // 检查是否有权限
  const hasPermission = (base: KnowledgeBase, requiredPermission: 'owner' | 'editor' | 'viewer') => {
    if (!currentUser) return false;
    if (base.owner_id === currentUser.id) return true;
    if (base.permission === 'public') return true;
    const sharedUser = sharedUsers.find(u => u.user.id === currentUser.id);
    if (!sharedUser) return false;
    const permissions = ['viewer', 'editor', 'owner'];
    return permissions.indexOf(sharedUser.permission) >= permissions.indexOf(requiredPermission);
  };

  // 渲染权限管理界面
  const renderPermissionManagement = () => {
    if (!selectedBase || !hasPermission(selectedBase, 'owner')) return null;

    return (
      <Box mt={4}>
        <Text fontSize="xl" fontWeight="bold" mb={4}>权限管理</Text>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>用户</Th>
              <Th>权限</Th>
              <Th>操作</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sharedUsers.map(({ user, permission }) => (
              <Tr key={user.id}>
                <Td>{user.username}</Td>
                <Td>
                  <Select
                    value={permission}
                    onChange={(e) => handleUpdatePermission(user.id, e.target.value)}
                  >
                    <option value="viewer">查看者</option>
                    <option value="editor">编辑者</option>
                    <option value="owner">所有者</option>
                  </Select>
                </Td>
                <Td>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleRemovePermission(user.id)}
                  >
                    移除
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    );
  };

  // 更新知识库列表渲染
  const renderKnowledgeBaseList = () => (
    <Table variant="simple">
      <Thead>
        <Tr>
          <Th>名称</Th>
          <Th>文档数</Th>
          <Th>词数</Th>
          <Th>状态</Th>
          <Th>权限</Th>
          <Th>操作</Th>
        </Tr>
      </Thead>
      <Tbody>
        {knowledgeBases.map((base) => (
          <Tr key={base.id}>
            <Td>{base.name}</Td>
            <Td>{base.document_count}</Td>
            <Td>{base.word_count}</Td>
            <Td>
              <Badge colorScheme={base.status === 'active' ? 'green' : 'gray'}>
                {base.status === 'active' ? '活跃' : '已归档'}
              </Badge>
            </Td>
            <Td>
              <Badge colorScheme={base.permission === 'public' ? 'blue' : 'purple'}>
                {base.permission === 'public' ? '公开' : '私有'}
              </Badge>
            </Td>
            <Td>
              {hasPermission(base, 'editor') && (
                <Tooltip label="编辑">
                  <IconButton
                    aria-label="Edit"
                    icon={<FiEdit2 />}
                    size="sm"
                    mr={2}
                    onClick={() => setSelectedBase(base)}
                  />
                </Tooltip>
              )}
              {hasPermission(base, 'owner') && (
                <Tooltip label="删除">
                  <IconButton
                    aria-label="Delete"
                    icon={<FiTrash2 />}
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDeleteKnowledgeBase(base.id)}
                  />
                </Tooltip>
              )}
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );

  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  return (
    <Box p={4}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Text fontSize="2xl" fontWeight="bold">知识库管理</Text>
        {currentUser && (
          <Button leftIcon={<FiUpload />} colorScheme="blue" onClick={onOpen}>
            创建知识库
          </Button>
        )}
      </Box>

      {renderKnowledgeBaseList()}
      {renderPermissionManagement()}

      {/* 创建知识库模态框 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>创建知识库</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>名称</FormLabel>
              <Input placeholder="输入知识库名称" />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>描述</FormLabel>
              <Textarea placeholder="输入知识库描述" />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>嵌入模型</FormLabel>
              <Select>
                <option value="text-embedding-ada-002">text-embedding-ada-002</option>
              </Select>
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>检索模型</FormLabel>
              <Select>
                <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                <option value="gpt-4">gpt-4</option>
              </Select>
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>分块大小</FormLabel>
              <NumberInput min={100} max={2000} defaultValue={1000}>
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>分块重叠</FormLabel>
              <NumberInput min={0} max={500} defaultValue={200}>
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>索引方式</FormLabel>
              <Select>
                <option value="high_quality">高质量</option>
                <option value="economy">经济</option>
              </Select>
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>权限</FormLabel>
              <Select>
                <option value="private">私有</option>
                <option value="public">公开</option>
              </Select>
            </FormControl>
            <Button colorScheme="blue" width="100%" mb={4}>
              创建
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* 索引进度 */}
      {indexingProgress && (
        <Box mt={4}>
          <Text mb={2}>索引进度</Text>
          <Progress
            value={(indexingProgress.processed / indexingProgress.total) * 100}
            colorScheme="blue"
          />
          <Text mt={2} fontSize="sm">
            {indexingProgress.processed} / {indexingProgress.total}
          </Text>
        </Box>
      )}
    </Box>
  );
}; 