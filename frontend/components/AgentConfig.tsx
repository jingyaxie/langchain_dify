import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Button,
  Select,
  useToast,
  Switch,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
} from '@chakra-ui/react';
import { Agent } from '../types';
import { agentApi } from '../services/api';

interface AgentConfigProps {
  agent?: Agent;
  onSave: (agent: Partial<Agent>) => void;
  onCancel: () => void;
}

const TOOL_OPTIONS = [
  { value: 'search', label: 'Web Search' },
  { value: 'calculator', label: 'Calculator' },
  { value: 'weather', label: 'Weather' },
  { value: 'knowledge_base', label: 'Knowledge Base' },
  { value: 'code_interpreter', label: 'Code Interpreter' },
];

const TEMPLATES = [
  {
    name: 'General Assistant',
    config: {
      system_prompt: 'You are a helpful AI assistant.',
      temperature: 0.7,
      tools: ['search', 'knowledge_base'],
    },
  },
  {
    name: 'Code Expert',
    config: {
      system_prompt: 'You are an expert programmer. Help users with coding questions and problems.',
      temperature: 0.3,
      tools: ['code_interpreter', 'search'],
    },
  },
  {
    name: 'Research Assistant',
    config: {
      system_prompt: 'You are a research assistant. Help users find and analyze information.',
      temperature: 0.5,
      tools: ['search', 'knowledge_base', 'calculator'],
    },
  },
];

export const AgentConfig: React.FC<AgentConfigProps> = ({
  agent,
  onSave,
  onCancel,
}) => {
  const [config, setConfig] = useState<Partial<Agent>>(
    agent || {
      name: '',
      description: '',
      system_prompt: '',
      temperature: 0.7,
      tools: [],
    }
  );
  const toast = useToast();

  const handleSave = async () => {
    try {
      if (!config.name) {
        throw new Error('Name is required');
      }

      await onSave(config);
      toast({
        title: 'Success',
        description: 'Agent configuration saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save configuration',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleTemplateSelect = (template: typeof TEMPLATES[0]) => {
    setConfig((prev) => ({
      ...prev,
      ...template.config,
    }));
  };

  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch">
        <Accordion allowMultiple>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  <Text fontWeight="bold">Templates</Text>
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <VStack spacing={4} align="stretch">
                {TEMPLATES.map((template) => (
                  <Box
                    key={template.name}
                    p={4}
                    borderWidth={1}
                    borderRadius="md"
                    cursor="pointer"
                    onClick={() => handleTemplateSelect(template)}
                    _hover={{ bg: 'gray.50' }}
                  >
                    <Text fontWeight="bold" mb={2}>
                      {template.name}
                    </Text>
                    <HStack spacing={2}>
                      {template.config.tools.map((tool) => (
                        <Badge key={tool} colorScheme="blue">
                          {TOOL_OPTIONS.find((t) => t.value === tool)?.label || tool}
                        </Badge>
                      ))}
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        <FormControl isRequired>
          <FormLabel>Name</FormLabel>
          <Input
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            placeholder="Enter agent name"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Description</FormLabel>
          <Textarea
            value={config.description}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            placeholder="Enter agent description"
          />
        </FormControl>

        <FormControl>
          <FormLabel>System Prompt</FormLabel>
          <Textarea
            value={config.system_prompt}
            onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
            placeholder="Enter system prompt"
            rows={4}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Temperature</FormLabel>
          <NumberInput
            min={0}
            max={1}
            step={0.1}
            value={config.temperature}
            onChange={(value) => setConfig({ ...config, temperature: Number(value) })}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>

        <FormControl>
          <FormLabel>Tools</FormLabel>
          <VStack align="stretch" spacing={2}>
            {TOOL_OPTIONS.map((tool) => (
              <HStack key={tool.value} justify="space-between">
                <Text>{tool.label}</Text>
                <Switch
                  isChecked={config.tools?.includes(tool.value)}
                  onChange={(e) => {
                    const tools = e.target.checked
                      ? [...(config.tools || []), tool.value]
                      : (config.tools || []).filter((t) => t !== tool.value);
                    setConfig({ ...config, tools });
                  }}
                />
              </HStack>
            ))}
          </VStack>
        </FormControl>

        <FormControl>
          <FormLabel>Knowledge Base</FormLabel>
          <Select
            value={config.knowledge_base}
            onChange={(e) => setConfig({ ...config, knowledge_base: e.target.value })}
            placeholder="Select knowledge base"
          >
            <option value="default">Default</option>
            <option value="custom">Custom</option>
          </Select>
        </FormControl>

        <HStack justify="flex-end" spacing={4}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button colorScheme="blue" onClick={handleSave}>
            Save
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}; 