import React, { useEffect, useState } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Heading,
  VStack,
  HStack,
  Select,
  Button,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { chatApi } from '../services/api';

interface UsageStats {
  total_cost: number;
  total_tokens: number;
  provider_stats: {
    [key: string]: {
      total_cost: number;
      total_tokens: number;
      models: {
        [key: string]: {
          total_cost: number;
          total_tokens: number;
          operations: {
            [key: string]: {
              total_cost: number;
              total_tokens: number;
              count: number;
            };
          };
        };
      };
    };
  };
  period: {
    start: string | null;
    end: string | null;
  };
}

interface UsageRecord {
  id: number;
  user_id: number;
  provider: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost: number;
  operation: string;
  timestamp: string;
  request_id: string;
  metadata: string | null;
}

const TokenUsage: React.FC = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const toast = useToast();

  const fetchUsageStats = async () => {
    try {
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      const response = await chatApi.getUsage({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });
      setStats(response);
    } catch (error) {
      toast({
        title: 'Error fetching usage stats',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const fetchUsageDetails = async () => {
    try {
      const response = await chatApi.getUsageDetails({
        limit: 100,
        offset: 0,
      });
      setRecords(response.records);
    } catch (error) {
      toast({
        title: 'Error fetching usage details',
        status: 'error',
        duration: 3000,
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUsageStats(), fetchUsageDetails()]);
      setLoading(false);
    };
    loadData();
  }, [timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <VStack spacing={6} align="stretch" p={4}>
      <HStack justify="space-between">
        <Heading size="lg">Token Usage</Heading>
        <Select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          width="200px"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </Select>
      </HStack>

      {stats && (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Stat>
            <StatLabel>Total Cost</StatLabel>
            <StatNumber>{formatCurrency(stats.total_cost)}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              {formatNumber(stats.total_tokens)} tokens
            </StatHelpText>
          </Stat>
        </SimpleGrid>
      )}

      {stats && Object.entries(stats.provider_stats).map(([provider, data]) => (
        <Box key={provider} p={4} borderWidth={1} borderRadius="lg">
          <Heading size="md" mb={4}>
            {provider.charAt(0).toUpperCase() + provider.slice(1)}
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Stat>
              <StatLabel>Cost</StatLabel>
              <StatNumber>{formatCurrency(data.total_cost)}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Tokens</StatLabel>
              <StatNumber>{formatNumber(data.total_tokens)}</StatNumber>
            </Stat>
          </SimpleGrid>
        </Box>
      ))}

      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Time</Th>
              <Th>Provider</Th>
              <Th>Model</Th>
              <Th>Operation</Th>
              <Th isNumeric>Tokens</Th>
              <Th isNumeric>Cost</Th>
            </Tr>
          </Thead>
          <Tbody>
            {records.map((record) => (
              <Tr key={record.id}>
                <Td>{format(new Date(record.timestamp), 'MMM d, yyyy HH:mm')}</Td>
                <Td>{record.provider}</Td>
                <Td>{record.model}</Td>
                <Td>{record.operation}</Td>
                <Td isNumeric>{formatNumber(record.total_tokens)}</Td>
                <Td isNumeric>{formatCurrency(record.cost)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </VStack>
  );
};

export default TokenUsage; 