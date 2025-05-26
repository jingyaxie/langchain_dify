import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  useToast,
  Spinner,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  Link,
  IconButton,
} from '@chakra-ui/react';
import { FiSearch, FiDownload, FiTrash2 } from 'react-icons/fi';
import { Document } from '../types';
import { knowledgeApi } from '../services/api';

interface KnowledgeSearchProps {
  collectionName: string;
}

export const KnowledgeSearch: React.FC<KnowledgeSearchProps> = ({
  collectionName,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const searchResults = await knowledgeApi.search(collectionName, query);
      setResults(searchResults);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search knowledge base',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const response = await fetch(document.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.metadata.filename || 'document';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
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

  const handleDelete = async (document: Document) => {
    try {
      await knowledgeApi.deleteDocument(collectionName, document.id);
      setResults((prev) => prev.filter((doc) => doc.id !== document.id));
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

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <HStack>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search knowledge base..."
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button
            leftIcon={<FiSearch />}
            onClick={handleSearch}
            isLoading={isLoading}
          >
            Search
          </Button>
        </HStack>

        {isLoading && (
          <Box textAlign="center" py={4}>
            <Spinner />
          </Box>
        )}

        <Accordion allowMultiple>
          {results.map((document) => (
            <AccordionItem key={document.id}>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Text fontWeight="bold">{document.metadata.filename}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(document.metadata.created_at).toLocaleString()}
                    </Text>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <VStack align="stretch" spacing={4}>
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Content:
                    </Text>
                    <Text>{document.content}</Text>
                  </Box>

                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Metadata:
                    </Text>
                    <VStack align="stretch" spacing={2}>
                      {Object.entries(document.metadata).map(([key, value]) => (
                        <HStack key={key} justify="space-between">
                          <Text fontSize="sm" color="gray.600">
                            {key}:
                          </Text>
                          <Text fontSize="sm">{value}</Text>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>

                  <HStack justify="flex-end" spacing={2}>
                    <IconButton
                      aria-label="Download document"
                      icon={<FiDownload />}
                      size="sm"
                      onClick={() => handleDownload(document)}
                    />
                    <IconButton
                      aria-label="Delete document"
                      icon={<FiTrash2 />}
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDelete(document)}
                    />
                  </HStack>
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>

        {!isLoading && results.length === 0 && query && (
          <Text textAlign="center" color="gray.500">
            No results found
          </Text>
        )}
      </VStack>
    </Box>
  );
}; 