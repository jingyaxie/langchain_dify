import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  useToast,
  Input,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { FiMoreVertical, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Conversation } from '../types';
import { chatApi } from '../services/api';

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  onSelectConversation,
  selectedConversationId,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [editingId, setEditingId] = useState<string>('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await chatApi.listConversations();
      setConversations(response);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await chatApi.deleteConversation(conversationId);
      toast({
        title: 'Success',
        description: 'Conversation deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadConversations();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete conversation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdateTitle = async () => {
    if (!editingId || !editingTitle) return;

    try {
      await chatApi.updateConversationTitle(editingId, editingTitle);
      toast({
        title: 'Success',
        description: 'Title updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
      loadConversations();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update title',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleStartEdit = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
    onOpen();
  };

  return (
    <Box>
      <VStack spacing={2} align="stretch">
        {conversations.map((conversation) => (
          <Box
            key={conversation.id}
            p={3}
            borderWidth={1}
            borderRadius="md"
            cursor="pointer"
            bg={selectedConversationId === conversation.id ? 'blue.50' : 'white'}
            onClick={() => onSelectConversation(conversation)}
          >
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold" noOfLines={1}>
                  {conversation.title}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {new Date(conversation.updated_at).toLocaleString()}
                </Text>
              </VStack>
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<FiMoreVertical />}
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                />
                <MenuList>
                  <MenuItem
                    icon={<FiEdit2 />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(conversation);
                    }}
                  >
                    Edit Title
                  </MenuItem>
                  <MenuItem
                    icon={<FiTrash2 />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conversation.id);
                    }}
                  >
                    Delete
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Box>
        ))}
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Conversation Title</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Input
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                placeholder="Enter new title"
              />
              <Button colorScheme="blue" onClick={handleUpdateTitle}>
                Save
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}; 