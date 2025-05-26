import React from 'react';
import { Box, Container } from '@chakra-ui/react';
import TokenUsage from '../../components/TokenUsage';

const UsagePage: React.FC = () => {
  return (
    <Container maxW="container.xl" py={8}>
      <Box>
        <TokenUsage />
      </Box>
    </Container>
  );
};

export default UsagePage; 