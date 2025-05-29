import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { Box, Spinner, Center } from '@chakra-ui/react';
import { authApi } from '../services/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const checkedRef = useRef(false);

  useEffect(() => {
    // 避免重复检查
    if (checkedRef.current) return;
    checkedRef.current = true;

    const checkAuth = async () => {
      if (!authApi.isAuthenticated()) {
        router.push('/login');
        return;
      }

      try {
        await authApi.getCurrentUser();
        setLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        authApi.logout();
        router.push('/login');
      }
    };

    checkAuth();
  }, []); // 移除router依赖，避免无限循环

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute; 