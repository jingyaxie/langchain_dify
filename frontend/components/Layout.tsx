import React from 'react';
import {
  Box,
  Flex,
  Heading,
  HStack,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  VStack,
  Text,
  useColorMode,
  useColorModeValue,
  Container,
} from '@chakra-ui/react';
import { FiSun, FiMoon, FiMenu, FiUser, FiSettings, FiLogOut } from 'react-icons/fi';
import { useAuth } from './AuthProvider';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title = 'LangChain Dify' }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, logout } = useAuth();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      {/* Header */}
      <Box bg={bg} borderBottom="1px" borderColor={borderColor} px={4} shadow="sm">
        <Flex h={16} alignItems="center" justifyContent="space-between">
          {/* Logo */}
          <HStack spacing={8} alignItems="center">
            <Box>
              <Heading size="md" bgGradient="linear(to-r, brand.400, brand.600)" bgClip="text">
                {title}
              </Heading>
            </Box>
          </HStack>

          {/* Right side */}
          <HStack spacing={4}>
            {/* Color mode toggle */}
            <IconButton
              size="md"
              variant="ghost"
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
              onClick={toggleColorMode}
            />

            {/* User menu */}
            {user && (
              <Menu>
                <MenuButton
                  as={Button}
                  rounded="full"
                  variant="link"
                  cursor="pointer"
                  minW={0}
                >
                  <Avatar size="sm" name={user.username} />
                </MenuButton>
                <MenuList>
                  <Box px={3} py={2}>
                    <Text fontWeight="semibold">{user.username}</Text>
                    {user.email && (
                      <Text fontSize="sm" color="gray.500">
                        {user.email}
                      </Text>
                    )}
                  </Box>
                  <MenuDivider />
                  <MenuItem icon={<FiUser />}>个人资料</MenuItem>
                  <MenuItem icon={<FiSettings />}>设置</MenuItem>
                  <MenuDivider />
                  <MenuItem icon={<FiLogOut />} onClick={logout}>
                    退出登录
                  </MenuItem>
                </MenuList>
              </Menu>
            )}
          </HStack>
        </Flex>
      </Box>

      {/* Main content */}
      <Container maxW="container.xl" py={8}>
        <Box
          bg={bg}
          shadow="md"
          rounded="xl"
          borderWidth="1px"
          borderColor={borderColor}
          p={6}
          className="fade-in"
        >
          {children}
        </Box>
      </Container>
    </Box>
  );
}; 