import React from 'react';
import { Box } from '@chakra-ui/react';
import { KnowledgeManager } from '../components/KnowledgeManager';
import ProtectedRoute from '../components/ProtectedRoute';

const Home: React.FC = () => {
  return (
    <ProtectedRoute>
      <Box>
        <KnowledgeManager />
      </Box>
    </ProtectedRoute>
  );
};

export default Home; 