import pdfplumber
from docx import Document
from typing import List, Optional
import os
from ..vectorstore.chroma_store import ChromaStore

class KnowledgeService:
    def __init__(self):
        self.vector_store = ChromaStore()
        
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"
        return text
    
    def extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        doc = Document(file_path)
        return "\n".join([paragraph.text for paragraph in doc.paragraphs])
    
    def extract_text_from_txt(self, file_path: str) -> str:
        """Extract text from TXT file"""
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    
    def process_document(self, file_path: str, collection_name: str, metadata: Optional[dict] = None):
        """Process document and store in vector database"""
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == '.pdf':
            text = self.extract_text_from_pdf(file_path)
        elif file_ext == '.docx':
            text = self.extract_text_from_docx(file_path)
        elif file_ext == '.txt':
            text = self.extract_text_from_txt(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_ext}")
        
        # Prepare metadata
        doc_metadata = {
            'source': file_path,
            'file_type': file_ext[1:],
            **(metadata or {})
        }
        
        # Store in vector database
        self.vector_store.add_texts(
            collection_name=collection_name,
            texts=[text],
            metadatas=[doc_metadata]
        )
        
    def search_knowledge_base(self, collection_name: str, query: str, k: int = 4):
        """Search the knowledge base"""
        return self.vector_store.similarity_search(collection_name, query, k=k) 