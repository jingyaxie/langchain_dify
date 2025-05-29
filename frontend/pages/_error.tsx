import React from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Center,
  useColorModeValue,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { FiHome, FiRefreshCw } from 'react-icons/fi';

interface ErrorProps {
  statusCode?: number;
  hasGetInitialPropsRun?: boolean;
  err?: Error;
}

const ErrorPage: React.FC<ErrorProps> = ({ statusCode }) => {
  const router = useRouter();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const getErrorMessage = () => {
    switch (statusCode) {
      case 404:
        return {
          title: '页面未找到',
          message: '抱歉，您访问的页面不存在。',
        };
      case 500:
        return {
          title: '服务器错误',
          message: '服务器内部错误，请稍后再试。',
        };
      default:
        return {
          title: '出现错误',
          message: '发生了未知错误，请稍后再试。',
        };
    }
  };

  const { title, message } = getErrorMessage();

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Center h="100vh">
        <Box
          bg={bg}
          shadow="md"
          rounded="xl"
          borderWidth="1px"
          borderColor={borderColor}
          p={8}
          maxW="md"
          textAlign="center"
        >
          <VStack spacing={6}>
            <Text fontSize="6xl" fontWeight="bold" color="gray.400">
              {statusCode || '?'}
            </Text>
            <Heading size="lg" color={useColorModeValue('gray.800', 'white')}>
              {title}
            </Heading>
            <Text color="gray.500" fontSize="lg">
              {message}
            </Text>
            <VStack spacing={3}>
              <Button
                leftIcon={<FiHome />}
                colorScheme="blue"
                onClick={() => router.push('/')}
              >
                返回首页
              </Button>
              <Button
                leftIcon={<FiRefreshCw />}
                variant="outline"
                onClick={() => router.reload()}
              >
                刷新页面
              </Button>
            </VStack>
          </VStack>
        </Box>
      </Center>
    </Box>
  );
};

ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage; 