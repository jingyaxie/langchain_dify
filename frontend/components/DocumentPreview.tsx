import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  useToast,
  Spinner,
  IconButton,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Code,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  AspectRatio,
} from '@chakra-ui/react';
import { FiDownload, FiTrash2, FiExternalLink, FiMaximize2 } from 'react-icons/fi';
import { Document } from '../types';
import { knowledgeApi } from '../services/api';

interface DocumentPreviewProps {
  document: Document;
  collectionName: string;
  onDelete?: () => void;
}

const SUPPORTED_PREVIEW_TYPES = [
  'text/plain',
  'text/markdown',
  'text/html',
  'application/json',
  'application/xml',
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'video/mp4',
  'video/webm',
  'video/ogg',
];

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const OFFICE_TYPES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  collectionName,
  onDelete,
}) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    loadContent();
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [document]);

  const loadContent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (document.url) {
        const response = await fetch(document.url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const contentType = document.content_type || 'text/plain';

        if (IMAGE_TYPES.includes(contentType) || VIDEO_TYPES.includes(contentType) || contentType === 'application/pdf') {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          setContent('');
        } else if (OFFICE_TYPES.includes(contentType)) {
          // 对于 Office 文档，使用后端转换服务
          const convertedResponse = await fetch(`/api/documents/${document.id}/preview`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });
          const convertedBlob = await convertedResponse.blob();
          const url = URL.createObjectURL(convertedBlob);
          setPreviewUrl(url);
          setContent('');
        } else {
          const text = await response.text();
          setContent(text);
        }
      } else {
        setContent('No content available');
      }
    } catch (error) {
      setError('Failed to load document content');
      toast({
        title: 'Error',
        description: 'Failed to load document content',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      if (document.url) {
        const response = await fetch(document.url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = document.name || 'document';
        window.document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        window.document.body.removeChild(a);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download document',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async () => {
    try {
      await knowledgeApi.deleteDocument(collectionName, document.id);
      if (onDelete) {
        onDelete();
      }
      toast({
        title: 'Success',
        description: 'Document deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <Box textAlign="center" py={4}>
          <Spinner />
        </Box>
      );
    }

    if (error) {
      return (
        <Box textAlign="center" py={4}>
          <Text color="red.500">{error}</Text>
        </Box>
      );
    }

    const contentType = document.content_type || 'text/plain';

    if (!SUPPORTED_PREVIEW_TYPES.includes(contentType)) {
      return (
        <Box textAlign="center" py={4}>
          <Text color="gray.500">Preview not available for this file type</Text>
        </Box>
      );
    }

    if (IMAGE_TYPES.includes(contentType) && previewUrl) {
      return (
        <Box position="relative">
          <Image
            src={previewUrl}
            alt={document.name}
            maxH="400px"
            objectFit="contain"
            borderRadius="md"
          />
          <IconButton
            aria-label="View full size"
            icon={<FiMaximize2 />}
            position="absolute"
            top={2}
            right={2}
            onClick={onOpen}
          />
        </Box>
      );
    }

    if (VIDEO_TYPES.includes(contentType) && previewUrl) {
      return (
        <AspectRatio ratio={16 / 9}>
          <video
            src={previewUrl}
            controls
            style={{ borderRadius: '0.375rem' }}
          />
        </AspectRatio>
      );
    }

    if (OFFICE_TYPES.includes(contentType) && previewUrl) {
      return (
        <Box h="600px">
          <iframe
            src={previewUrl}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title={document.name}
          />
        </Box>
      );
    }

    if (contentType === 'application/pdf' && previewUrl) {
      return (
        <Box h="600px">
          <iframe
            src={previewUrl}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title={document.name}
          />
        </Box>
      );
    }

    return (
      <Tabs>
        <TabList>
          <Tab>Preview</Tab>
          <Tab>Raw</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Box
              p={4}
              borderWidth={1}
              borderRadius="md"
              bg="gray.50"
              whiteSpace="pre-wrap"
              fontFamily="mono"
              fontSize="sm"
            >
              {content}
            </Box>
          </TabPanel>
          <TabPanel>
            <Code
              p={4}
              borderRadius="md"
              whiteSpace="pre-wrap"
              display="block"
              overflowX="auto"
            >
              {content}
            </Code>
          </TabPanel>
        </TabPanels>
      </Tabs>
    );
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold">{document.name}</Text>
            <HStack spacing={2}>
              <Badge colorScheme="blue">
                {document.content_type || 'text/plain'}
              </Badge>
              <Text fontSize="sm" color="gray.500">
                {new Date(document.created_at).toLocaleString()}
              </Text>
            </HStack>
          </VStack>
          <HStack spacing={2}>
            {document.url && (
              <IconButton
                aria-label="Download document"
                icon={<FiDownload />}
                size="sm"
                onClick={handleDownload}
              />
            )}
            <IconButton
              aria-label="Delete document"
              icon={<FiTrash2 />}
              size="sm"
              colorScheme="red"
              onClick={handleDelete}
            />
          </HStack>
        </HStack>

        {renderContent()}
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} size="full">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{document.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {IMAGE_TYPES.includes(document.content_type || '') && previewUrl && (
              <Image
                src={previewUrl}
                alt={document.name}
                maxH="90vh"
                objectFit="contain"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}; 