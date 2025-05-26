import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  Text,
  useToast,
  Input,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { knowledgeApi } from '../services/api';

interface FileUploadProps {
  collectionName: string;
  onUploadComplete?: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  collectionName,
  onUploadComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      await knowledgeApi.uploadDocument(file, collectionName);
      toast({
        title: 'Success',
        description: 'File uploaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setFile(null);
      onUploadComplete?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box p={4} borderWidth={1} borderRadius="md">
      <VStack spacing={4}>
        <FormControl>
          <FormLabel>Upload Document</FormLabel>
          <Input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </FormControl>

        {file && (
          <Text fontSize="sm" color="gray.600">
            Selected file: {file.name}
          </Text>
        )}

        <Button
          colorScheme="blue"
          onClick={handleUpload}
          isLoading={isUploading}
          isDisabled={!file}
        >
          Upload
        </Button>
      </VStack>
    </Box>
  );
}; 