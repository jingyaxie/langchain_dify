import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
  useDisclosure,
} from '@chakra-ui/react';
import { agentApi } from '../services/api';

interface Agent {
  name: string;
  description: string;
  system_prompt: string;
  temperature: number;
  tools: string[];
  knowledge_base?: string;
}

export const AgentManager: React.FC = () => {
  const [agents, setAgents] = useState<Record<string, Agent>>({});
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [newAgent, setNewAgent] = useState<Partial<Agent>>({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const response = await agentApi.listAgents();
      setAgents(response);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load agents',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCreateAgent = async () => {
    if (!newAgent.name) return;

    try {
      await agentApi.createAgent(newAgent.name, newAgent);
      toast({
        title: 'Success',
        description: 'Agent created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
      loadAgents();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create agent',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      await agentApi.deleteAgent(agentId);
      toast({
        title: 'Success',
        description: 'Agent deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadAgents();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete agent',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="xl" fontWeight="bold">
            Agent Manager
          </Text>
          <Button colorScheme="blue" onClick={onOpen}>
            Create New Agent
          </Button>
        </HStack>

        {Object.entries(agents).map(([id, agent]) => (
          <Box
            key={id}
            p={4}
            borderWidth={1}
            borderRadius="md"
            onClick={() => setSelectedAgent(id)}
            cursor="pointer"
            bg={selectedAgent === id ? 'blue.50' : 'white'}
          >
            <VStack align="stretch" spacing={2}>
              <Text fontSize="lg" fontWeight="bold">
                {agent.name}
              </Text>
              <Text color="gray.600">{agent.description}</Text>
              <HStack justify="flex-end">
                <Button
                  size="sm"
                  colorScheme="red"
                  onClick={() => handleDeleteAgent(id)}
                >
                  Delete
                </Button>
              </HStack>
            </VStack>
          </Box>
        ))}
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Agent</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input
                  value={newAgent.name || ''}
                  onChange={(e) =>
                    setNewAgent({ ...newAgent, name: e.target.value })
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Input
                  value={newAgent.description || ''}
                  onChange={(e) =>
                    setNewAgent({ ...newAgent, description: e.target.value })
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>System Prompt</FormLabel>
                <Textarea
                  value={newAgent.system_prompt || ''}
                  onChange={(e) =>
                    setNewAgent({ ...newAgent, system_prompt: e.target.value })
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>Temperature</FormLabel>
                <NumberInput
                  min={0}
                  max={1}
                  step={0.1}
                  value={newAgent.temperature || 0.7}
                  onChange={(value) =>
                    setNewAgent({ ...newAgent, temperature: Number(value) })
                  }
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>

              <Button colorScheme="blue" onClick={handleCreateAgent}>
                Create
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}; 