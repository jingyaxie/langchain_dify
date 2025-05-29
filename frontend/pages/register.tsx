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
import { FiUser, FiMail, FiLock } from 'react-icons/fi';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: '请填写必要信息',
        description: '用户名和密码不能为空',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: '密码太短',
        description: '密码长度至少6个字符',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: '密码不匹配',
        description: '请确保两次输入的密码相同',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    try {
      setLoading(true);
      await authApi.register({ username, email, password });
      toast({
        title: '注册成功',
        description: '已自动登录，正在跳转...',
        status: 'success',
        duration: 3000,
      });
      // 注册成功后直接跳转到主页（因为注册API会自动设置token）
      router.push('/');
    } catch (error) {
      toast({
        title: '注册失败',
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
                创建账号
              </Heading>
              <Text color="gray.600" textAlign="center">
                加入 LangChain Dify
              </Text>
            </VStack>

            <Divider />

            {/* Register Form */}
            <form onSubmit={handleRegister}>
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

                <FormControl>
                  <FormLabel color="gray.700">邮箱 (可选)</FormLabel>
                  <HStack>
                    <Icon as={FiMail} color="gray.400" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="请输入邮箱地址"
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
                      placeholder="请输入密码 (至少6位)"
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
                  <FormLabel color="gray.700">确认密码</FormLabel>
                  <HStack>
                    <Icon as={FiLock} color="gray.400" />
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="请再次输入密码"
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
                  loadingText="注册中..."
                  borderRadius="lg"
                  _hover={{
                    transform: 'translateY(-1px)',
                    boxShadow: 'lg',
                  }}
                  transition="all 0.2s"
                >
                  注册账号
                </Button>
              </VStack>
            </form>

            <Divider />

            {/* Footer */}
            <Text textAlign="center" color="gray.600">
              已有账号？{' '}
              <Link 
                color="brand.500" 
                href="/login"
                fontWeight="semibold"
                _hover={{
                  color: 'brand.600',
                  textDecoration: 'none',
                }}
              >
                立即登录
              </Link>
            </Text>
          </VStack>
        </Box>

        {/* Demo Info */}
        <Box mt={6} p={4} bg="blue.50" borderRadius="lg" textAlign="center">
          <Text fontSize="sm" color="blue.700">
            💡 演示环境：注册后将自动登录并跳转到主页
          </Text>
        </Box>
      </Container>
    </Box>
  );
};

export default Register; 