import pdfplumber
from docx import Document
from typing import List, Optional
import os
import chardet
from ..vectorstore.chroma_store import ChromaStore

class KnowledgeService:
    def __init__(self):
        self.vector_store = ChromaStore()
        
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        text = ""
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")
        return text
    
    def extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = Document(file_path)
            return "\n".join([paragraph.text for paragraph in doc.paragraphs])
        except Exception as e:
            raise ValueError(f"Failed to extract text from DOCX: {str(e)}")
    
    def extract_text_from_txt(self, file_path: str) -> str:
        """Extract text from TXT file with encoding detection"""
        try:
            # First, try to detect encoding
            with open(file_path, 'rb') as file:
                raw_data = file.read()
                
            # Detect encoding
            result = chardet.detect(raw_data)
            encoding = result['encoding']
            confidence = result['confidence']
            
            print(f"Detected encoding: {encoding} (confidence: {confidence:.2f})")
            
            # Try multiple encodings in order of preference
            encodings_to_try = []
            if encoding and confidence > 0.7:
                encodings_to_try.append(encoding)
            
            # Add common encodings
            common_encodings = ['utf-8', 'gbk', 'gb2312', 'utf-16', 'latin-1', 'cp1252']
            for enc in common_encodings:
                if enc not in encodings_to_try:
                    encodings_to_try.append(enc)
            
            # Try each encoding
            for enc in encodings_to_try:
                try:
                    text = raw_data.decode(enc)
                    print(f"Successfully decoded with encoding: {enc}")
                    return text
                except (UnicodeDecodeError, LookupError):
                    continue
            
            # If all encodings fail, use utf-8 with error handling
            try:
                text = raw_data.decode('utf-8', errors='replace')
                print("Warning: Used UTF-8 with error replacement for problematic characters")
                return text
            except Exception as e:
                raise ValueError(f"Failed to decode text file with any encoding: {str(e)}")
                
        except Exception as e:
            raise ValueError(f"Failed to read text file: {str(e)}")
    
    def process_document(self, file_path: str, collection_name: str, metadata: Optional[dict] = None,
                        chunk_size: int = None, chunk_overlap: int = None,
                        splitter_type: str = "recursive", custom_separators: str = "",
                        length_function: str = "char_count", keep_separator: bool = True,
                        add_start_index: bool = False, strip_whitespace: bool = True,
                        cleaning_rules: str = None):  # 改为字符串类型
        """Process document and store in vector database with advanced segmentation parameters"""
        try:
            # Check file size (max 50MB)
            file_size = os.path.getsize(file_path)
            max_file_size = 50 * 1024 * 1024  # 50MB
            if file_size > max_file_size:
                raise ValueError(f"File too large: {file_size / (1024*1024):.1f}MB. Maximum allowed: {max_file_size / (1024*1024)}MB")
            
            file_ext = os.path.splitext(file_path)[1].lower()
            
            if file_ext == '.pdf':
                text = self.extract_text_from_pdf(file_path)
            elif file_ext == '.docx':
                text = self.extract_text_from_docx(file_path)
            elif file_ext in ['.txt', '.md']:
                text = self.extract_text_from_txt(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_ext}")
            
            # Check if text is not empty
            if not text or not text.strip():
                raise ValueError(f"No text content extracted from file: {file_path}")
            
            # Check text length (max 10MB of text)
            max_text_length = 10 * 1024 * 1024  # 10MB
            if len(text) > max_text_length:
                # Truncate text if too long
                text = text[:max_text_length]
                print(f"Warning: Text truncated to {max_text_length / (1024*1024):.1f}MB for file: {file_path}")
            
            # 根据文件类型自动选择分割器
            if splitter_type == "auto":
                if file_ext == '.md':
                    splitter_type = "markdown"
                elif file_ext == '.py':
                    splitter_type = "python"
                elif file_ext in ['.html', '.htm']:
                    splitter_type = "html"
                else:
                    splitter_type = "recursive"
            
            # Convert cleaning_rules to list if it's a string
            if isinstance(cleaning_rules, str) and cleaning_rules:
                cleaning_rules_list = [rule.strip() for rule in cleaning_rules.split(',') if rule.strip()]
            elif isinstance(cleaning_rules, list):
                cleaning_rules_list = cleaning_rules
            else:
                cleaning_rules_list = []
            
            # Prepare metadata - ensure all values are simple types
            doc_metadata = {
                'source': file_path,
                'file_type': file_ext[1:],
                'text_length': len(text),
                'file_size': file_size,
                'chunk_size_config': chunk_size or 1000,
                'chunk_overlap_config': chunk_overlap or 200,
                'splitter_type_config': splitter_type,
                'length_function_config': length_function,
                'cleaning_rules_config': ','.join(cleaning_rules_list) if cleaning_rules_list else '',
            }
            
            # Add user metadata, ensuring all values are simple types
            if metadata:
                for key, value in metadata.items():
                    if isinstance(value, (str, int, float, bool)):
                        doc_metadata[key] = value
                    else:
                        doc_metadata[key] = str(value)
            
            print(f"Processing document: {file_path} (size: {file_size / 1024:.1f}KB, text: {len(text)} chars)")
            print(f"Using splitter: {splitter_type}, chunk_size: {chunk_size or 1000}, chunk_overlap: {chunk_overlap or 200}")
            if cleaning_rules_list:
                print(f"Applying cleaning rules: {', '.join(cleaning_rules_list)}")
            
            # Store in vector database with advanced segmentation parameters
            self.vector_store.add_texts(
                collection_name=collection_name,
                texts=[text],
                metadatas=[doc_metadata],
                splitter_type=splitter_type,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                custom_separators=custom_separators,
                length_function=length_function,
                keep_separator=keep_separator,
                add_start_index=add_start_index,
                strip_whitespace=strip_whitespace,
                cleaning_rules=cleaning_rules_list
            )
            
            print(f"Successfully processed document: {file_path}")
            
        except Exception as e:
            print(f"Error processing document {file_path}: {str(e)}")
            raise e
        
    def search_knowledge_base(self, collection_name: str, query: str, k: int = 4):
        """Search the knowledge base"""
        return self.vector_store.similarity_search(collection_name, query, k=k)
    
    def get_document_chunks(self, collection_name: str, document_filename: str):
        """获取指定文档的所有分段"""
        try:
            return self.vector_store.get_document_chunks(collection_name, document_filename)
        except Exception as e:
            print(f"Error getting document chunks for {document_filename}: {str(e)}")
            raise e 