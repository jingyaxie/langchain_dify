import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Link,
  Container,
  useColorModeValue,
  HStack,
  Icon,
  Divider,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { authApi } from '../services/auth';
import { FiUser, FiLock } from 'react-icons/fi';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await authApi.login({ username, password });
      router.push('/');
    } catch (error) {
      toast({
        title: '登录失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      minH="100vh" 
      bgGradient="linear(to-br, brand.50, blue.50)" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      py={12}
      px={4}
    >
      <Container maxW="sm">
        <Box
          bg={bg}
          p={8}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="2xl"
          boxShadow="2xl"
          className="fade-in"
        >
          <VStack spacing={6} align="stretch">
            {/* Header */}
            <VStack spacing={2}>
              <Heading 
                size="lg" 
                textAlign="center"
                bgGradient="linear(to-r, brand.400, brand.600)"
                bgClip="text"
              >
                欢迎回来
              </Heading>
              <Text color="gray.600" textAlign="center">
                登录到 LangChain Dify
              </Text>
            </VStack>

            <Divider />

            {/* Login Form */}
            <form onSubmit={handleLogin}>
              <VStack spacing={5}>
                <FormControl isRequired>
                  <FormLabel color="gray.700">用户名</FormLabel>
                  <HStack>
                    <Icon as={FiUser} color="gray.400" />
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="请输入用户名"
                      size="lg"
                      borderRadius="lg"
                      _focus={{
                        borderColor: 'brand.400',
                        boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)',
                      }}
                    />
                  </HStack>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color="gray.700">密码</FormLabel>
                  <HStack>
                    <Icon as={FiLock} color="gray.400" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入密码"
                      size="lg"
                      borderRadius="lg"
                      _focus={{
                        borderColor: 'brand.400',
                        boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)',
                      }}
                    />
                  </HStack>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="brand"
                  size="lg"
                  width="100%"
                  isLoading={loading}
                  loadingText="登录中..."
                  borderRadius="lg"
                  _hover={{
                    transform: 'translateY(-1px)',
                    boxShadow: 'lg',
                  }}
                  transition="all 0.2s"
                >
                  登录
                </Button>
              </VStack>
            </form>

            <Divider />

            {/* Footer */}
            <Text textAlign="center" color="gray.600">
              还没有账号？{' '}
              <Link 
                color="brand.500" 
                href="/register"
                fontWeight="semibold"
                _hover={{
                  color: 'brand.600',
                  textDecoration: 'none',
                }}
              >
                立即注册
              </Link>
            </Text>
          </VStack>
        </Box>

        {/* Demo Info */}
        <Box mt={6} p={4} bg="blue.50" borderRadius="lg" textAlign="center">
          <Text fontSize="sm" color="blue.700">
            💡 演示环境：您可以使用任意用户名和密码登录
          </Text>
        </Box>
      </Container>
    </Box>
  );
};

export default Login; 