import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  useToast,
  Progress,
  Checkbox,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
} from '@chakra-ui/react';
import { FiMoreVertical, FiUpload, FiDownload, FiTrash2, FiFolder } from 'react-icons/fi';
import { Document, Collection } from '../types';
import { knowledgeApi } from '../services/api';

interface BatchOperationsProps {
  collection: Collection;
  documents: Document[];
  onDocumentsChange: () => void;
}

export const BatchOperations: React.FC<BatchOperationsProps> = ({
  collection,
  documents,
  onDocumentsChange,
}) => {
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newCollectionName, setNewCollectionName] = useState('');
  const toast = useToast();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocs(new Set(documents.map((doc) => doc.id)));
    } else {
      setSelectedDocs(new Set());
    }
  };

  const handleSelectDocument = (docId: string, checked: boolean) => {
    const newSelected = new Set(selectedDocs);
    if (checked) {
      newSelected.add(docId);
    } else {
      newSelected.delete(docId);
    }
    setSelectedDocs(newSelected);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const totalFiles = files.length;
      let completedFiles = 0;

      for (const file of Array.from(files)) {
        await knowledgeApi.uploadDocument(file, collection.name);
        completedFiles++;
        setUploadProgress((completedFiles / totalFiles) * 100);
      }

      toast({
        title: 'Success',
        description: `Successfully uploaded ${totalFiles} files`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onDocumentsChange();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload files',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = async () => {
    if (selectedDocs.size === 0) return;

    try {
      const selectedDocuments = documents.filter((doc) => selectedDocs.has(doc.id));
      const zip = new JSZip();

      for (const doc of selectedDocuments) {
        if (doc.url) {
          const response = await fetch(doc.url);
          const blob = await response.blob();
          zip.file(doc.metadata.filename, blob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${collection.name}_documents.zip`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download documents',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async () => {
    if (selectedDocs.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedDocs).map((docId) =>
          knowledgeApi.deleteDocument(collection.name, docId)
        )
      );

      toast({
        title: 'Success',
        description: `Successfully deleted ${selectedDocs.size} documents`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setSelectedDocs(new Set());
      onDocumentsChange();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete documents',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleMove = async () => {
    if (selectedDocs.size === 0 || !newCollectionName) return;

    try {
      // First create the new collection if it doesn't exist
      await knowledgeApi.createCollection(newCollectionName);

      // Then move the documents
      await Promise.all(
        Array.from(selectedDocs).map((docId) =>
          knowledgeApi.moveDocument(collection.name, newCollectionName, docId)
        )
      );

      toast({
        title: 'Success',
        description: `Successfully moved ${selectedDocs.size} documents to ${newCollectionName}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setSelectedDocs(new Set());
      onDocumentsChange();
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to move documents',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <HStack>
            <Checkbox
              isChecked={selectedDocs.size === documents.length}
              isIndeterminate={
                selectedDocs.size > 0 && selectedDocs.size < documents.length
              }
              onChange={(e) => handleSelectAll(e.target.checked)}
            >
              Select All
            </Checkbox>
            <Text color="gray.500">
              {selectedDocs.size} of {documents.length} selected
            </Text>
          </HStack>

          <HStack>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleUpload}
              style={{ display: 'none' }}
            />
            <Button
              leftIcon={<FiUpload />}
              onClick={() => fileInputRef.current?.click()}
              isLoading={isUploading}
            >
              Upload
            </Button>
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FiMoreVertical />}
                variant="ghost"
              />
              <MenuList>
                <MenuItem
                  icon={<FiDownload />}
                  onClick={handleDownload}
                  isDisabled={selectedDocs.size === 0}
                >
                  Download Selected
                </MenuItem>
                <MenuItem
                  icon={<FiFolder />}
                  onClick={onOpen}
                  isDisabled={selectedDocs.size === 0}
                >
                  Move to Collection
                </MenuItem>
                <MenuItem
                  icon={<FiTrash2 />}
                  onClick={handleDelete}
                  isDisabled={selectedDocs.size === 0}
                  color="red.500"
                >
                  Delete Selected
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </HStack>

        {isUploading && (
          <Progress value={uploadProgress} size="sm" colorScheme="blue" />
        )}

        <VStack align="stretch" spacing={2}>
          {documents.map((doc) => (
            <HStack key={doc.id} justify="space-between">
              <HStack>
                <Checkbox
                  isChecked={selectedDocs.has(doc.id)}
                  onChange={(e) => handleSelectDocument(doc.id, e.target.checked)}
                />
                <Text>{doc.metadata.filename}</Text>
              </HStack>
            </HStack>
          ))}
        </VStack>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Move to Collection</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Collection Name</FormLabel>
              <Input
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Enter collection name"
              />
            </FormControl>
            <HStack justify="flex-end" mt={4}>
              <Button onClick={onClose}>Cancel</Button>
              <Button
                colorScheme="blue"
                onClick={handleMove}
                isDisabled={!newCollectionName}
              >
                Move
              </Button>
            </HStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}; 