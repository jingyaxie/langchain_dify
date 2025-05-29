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
import { FiHome, FiSearch } from 'react-icons/fi';

const Custom404: React.FC = () => {
  const router = useRouter();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

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
              404
            </Text>
            <Heading size="lg" color={useColorModeValue('gray.800', 'white')}>
              页面未找到
            </Heading>
            <Text color="gray.500" fontSize="lg">
              抱歉，您访问的页面不存在或已被移动。
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
                leftIcon={<FiSearch />}
                variant="outline"
                onClick={() => router.back()}
              >
                返回上一页
              </Button>
            </VStack>
          </VStack>
        </Box>
      </Center>
    </Box>
  );
};

export default Custom404; 