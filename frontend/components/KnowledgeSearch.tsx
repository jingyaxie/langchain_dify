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
} from '@chakra-ui/react';
import { FiSearch } from 'react-icons/fi';
import { knowledgeApi } from '../services/api';

interface SearchResultItem {
  content: string;
  metadata: any;
  score: number;
}

interface KnowledgeSearchProps {
  collectionName: string;
}

export const KnowledgeSearch: React.FC<KnowledgeSearchProps> = ({
  collectionName,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const response = await knowledgeApi.search({
        knowledge_base_id: collectionName,
        query: query,
        limit: 10
      });
      console.log('Search response:', response.data);
      
      // 处理后端返回的数据格式
      const rawResults = response.data.data.results || [];
      
      // 转换为期望的格式
      const formattedResults: SearchResultItem[] = rawResults.map((result: any) => ({
        content: result.content || result.page_content || '',
        metadata: result.metadata || {},
        score: result.score || 1.0
      }));
      
      setResults(formattedResults);
    } catch (error) {
      console.error('Search error:', error);
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
          {results.map((result, index) => (
            <AccordionItem key={index}>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Text fontWeight="bold">
                      {result.metadata?.filename || `Result ${index + 1}`}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Score: {result.score?.toFixed(2) || 'N/A'}
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
                    <Text whiteSpace="pre-wrap">{result.content}</Text>
                  </Box>

                  {result.metadata && Object.keys(result.metadata).length > 0 && (
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        Metadata:
                      </Text>
                      <VStack align="stretch" spacing={2}>
                        {Object.entries(result.metadata).map(([key, value]) => (
                          <HStack key={key} justify="space-between">
                            <Text fontSize="sm" color="gray.600">
                              {key}:
                            </Text>
                            <Text fontSize="sm">{String(value)}</Text>
                          </HStack>
                        ))}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>

        {!isLoading && results.length === 0 && query && (
          <Text textAlign="center" color="gray.500">
            No results found for "{query}"
          </Text>
        )}

        {!isLoading && results.length > 0 && (
          <Text textAlign="center" color="gray.600" fontSize="sm">
            Found {results.length} result(s)
          </Text>
        )}
      </VStack>
    </Box>
  );
}; 