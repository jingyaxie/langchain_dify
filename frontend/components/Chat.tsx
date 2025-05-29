import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  useToast,
  Flex,
  Spinner,
  IconButton,
  Grid,
  GridItem,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Textarea,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Badge,
  Image,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2, FiMessageSquare, FiCopy, FiPaperclip, FiImage, FiMic } from 'react-icons/fi';
import { Message, Conversation, Attachment } from '../types';
import { chatApi } from '../services/api';
import { ConversationList } from './ConversationList';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface ChatProps {
  collectionName?: string;
}

export const Chat: React.FC<ChatProps> = ({ collectionName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
        setAttachments(prev => [...prev, file]);
      };

      audioRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start recording',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleStopRecording = () => {
    if (audioRecorderRef.current && isRecording) {
      audioRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;

    const formData = new FormData();
    formData.append('message', input);
    attachments.forEach(file => {
      formData.append('files', file);
    });

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
      reply_to: replyingTo?.id,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setReplyingTo(null);
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage(
        formData,
        currentConversation?.id,
        collectionName
      );

      if (!currentConversation) {
        const newConversation = await chatApi.getConversation(response.conversation_id);
        setCurrentConversation(newConversation);
      }

      setMessages((prev) => [...prev, response.message]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMessage = async (message: Message) => {
    setEditingMessage(message);
    setInput(message.content);
    onOpen();
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await chatApi.deleteMessage(messageId);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      toast({
        title: 'Success',
        description: 'Message deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Success',
      description: 'Message copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleReplyToMessage = (message: Message) => {
    setReplyingTo(message);
    setInput('');
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || !input.trim()) return;

    try {
      const updatedMessage = await chatApi.updateMessage(editingMessage.id, input);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === editingMessage.id ? updatedMessage : msg))
      );
      setEditingMessage(null);
      setInput('');
      onClose();
      toast({
        title: 'Success',
        description: 'Message updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update message',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const renderAttachment = (attachment: Attachment) => {
    switch (attachment.type) {
      case 'image':
        return (
          <Image
            src={attachment.url}
            alt={attachment.name}
            maxH="200px"
            borderRadius="md"
          />
        );
      case 'audio':
        return (
          <audio controls>
            <source src={attachment.url} type={attachment.mime_type} />
            Your browser does not support the audio element.
          </audio>
        );
      default:
        return (
          <HStack>
            <FiPaperclip />
            <Text>{attachment.name}</Text>
            <Text fontSize="sm" color="gray.500">
              {(attachment.size / 1024).toFixed(1)} KB
            </Text>
          </HStack>
        );
    }
  };

  const renderMessage = (message: Message) => {
    const isReplyingTo = messages.find((msg) => msg.id === message.reply_to);
    
    return (
      <Box
        key={message.id}
        mb={4}
        p={3}
        borderRadius="md"
        bg={message.role === 'user' ? 'blue.50' : 'gray.50'}
      >
        {isReplyingTo && (
          <Box mb={2} p={2} bg="gray.100" borderRadius="md" fontSize="sm">
            <Text color="gray.600">Replying to:</Text>
            <Text>{isReplyingTo.content}</Text>
          </Box>
        )}
        <HStack justify="space-between" mb={2}>
          <Text fontWeight="bold">
            {message.role === 'user' ? 'You' : 'Assistant'}
          </Text>
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<FiMessageSquare />}
              variant="ghost"
              size="sm"
            />
            <MenuList>
              <MenuItem
                icon={<FiEdit2 />}
                onClick={() => handleEditMessage(message)}
              >
                Edit
              </MenuItem>
              <MenuItem
                icon={<FiTrash2 />}
                onClick={() => handleDeleteMessage(message.id)}
              >
                Delete
              </MenuItem>
              <MenuItem
                icon={<FiCopy />}
                onClick={() => handleCopyMessage(message.content)}
              >
                Copy
              </MenuItem>
              <MenuItem
                icon={<FiMessageSquare />}
                onClick={() => handleReplyToMessage(message)}
              >
                Reply
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
        <Box>
          <ReactMarkdown
            components={{
              code({ className, children }) {
                const match = /language-(\w+)/.exec(className || '');
                return match ? (
                  <SyntaxHighlighter
                    language={match[1]}
                    PreTag="div"
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </Box>
        {message.attachments && message.attachments.length > 0 && (
          <VStack align="start" mt={2} spacing={2}>
            {message.attachments.map((attachment) => (
              <Box key={attachment.id} w="full">
                {renderAttachment(attachment)}
              </Box>
            ))}
          </VStack>
        )}
        {message.sources && message.sources.length > 0 && (
          <Box mt={2} fontSize="sm" color="gray.600">
            <Text fontWeight="bold">Sources:</Text>
            {message.sources.map((source, idx) => (
              <Text key={idx} ml={2}>
                {source.metadata.source}
              </Text>
            ))}
          </Box>
        )}
        <Text fontSize="xs" color="gray.500" mt={2}>
          {new Date(message.created_at).toLocaleString()}
        </Text>
      </Box>
    );
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setMessages(conversation.messages);
  };

  const handleNewConversation = async () => {
    try {
      const newConversation = await chatApi.createConversation('New Conversation');
      setCurrentConversation(newConversation);
      setMessages([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create new conversation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box h="100vh" p={4}>
      <Grid templateColumns="250px 1fr" gap={4} h="full">
        <GridItem>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="bold">
                Conversations
              </Text>
              <IconButton
                aria-label="New conversation"
                icon={<FiPlus />}
                size="sm"
                onClick={handleNewConversation}
              />
            </HStack>
            <ConversationList
              onSelectConversation={handleSelectConversation}
              selectedConversationId={currentConversation?.id}
            />
          </VStack>
        </GridItem>

        <GridItem>
          <VStack h="full" spacing={4}>
            <Box
              flex={1}
              w="full"
              overflowY="auto"
              borderWidth={1}
              borderRadius="md"
              p={4}
            >
              {messages.map(renderMessage)}
              {isLoading && (
                <Flex justify="center" my={4}>
                  <Spinner />
                </Flex>
              )}
              <div ref={messagesEndRef} />
            </Box>

            {attachments.length > 0 && (
              <Box w="full" p={2} bg="gray.100" borderRadius="md">
                <VStack align="start" spacing={2}>
                  {attachments.map((file, index) => (
                    <HStack key={index} justify="space-between" w="full">
                      <HStack>
                        <FiPaperclip />
                        <Text>{file.name}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {(file.size / 1024).toFixed(1)} KB
                        </Text>
                      </HStack>
                      <IconButton
                        aria-label="Remove attachment"
                        icon={<FiTrash2 />}
                        size="sm"
                        onClick={() => handleRemoveAttachment(index)}
                      />
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}

            {replyingTo && (
              <Box w="full" p={2} bg="gray.100" borderRadius="md">
                <HStack justify="space-between">
                  <Text fontSize="sm">Replying to: {replyingTo.content}</Text>
                  <IconButton
                    aria-label="Cancel reply"
                    icon={<FiTrash2 />}
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                  />
                </HStack>
              </Box>
            )}

            <HStack w="full">
              <InputGroup>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                />
                <InputRightElement>
                  <HStack spacing={2}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                      multiple
                    />
                    <IconButton
                      aria-label="Attach file"
                      icon={<FiPaperclip />}
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    />
                    <IconButton
                      aria-label="Attach image"
                      icon={<FiImage />}
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    />
                    <IconButton
                      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                      icon={<FiMic />}
                      size="sm"
                      colorScheme={isRecording ? 'red' : undefined}
                      onClick={isRecording ? handleStopRecording : handleStartRecording}
                    />
                  </HStack>
                </InputRightElement>
              </InputGroup>
              <Button
                colorScheme="blue"
                onClick={handleSend}
                isLoading={isLoading}
              >
                Send
              </Button>
            </HStack>
          </VStack>
        </GridItem>
      </Grid>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Message</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Edit your message..."
                rows={4}
              />
              <Button colorScheme="blue" onClick={handleSaveEdit}>
                Save
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}; 