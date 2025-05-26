import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Spinner, Center } from '@chakra-ui/react';
import { authApi } from '../services/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!authApi.isAuthenticated()) {
        router.push('/login');
        return;
      }

      try {
        await authApi.getCurrentUser();
        setLoading(false);
      } catch (error) {
        authApi.logout();
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

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