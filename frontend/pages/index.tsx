import React from 'react';
import KnowledgeManager from '../components/KnowledgeManager';
import { Layout } from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';

const Home: React.FC = () => {
  return (
    <ProtectedRoute>
      <Layout title="LangChain Dify - 知识库管理">
        <KnowledgeManager />
      </Layout>
    </ProtectedRoute>
  );
};

export default Home; 