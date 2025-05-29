from langchain_community.vectorstores import Chroma
from langchain_core.embeddings import Embeddings
from langchain.text_splitter import (
    RecursiveCharacterTextSplitter,
    CharacterTextSplitter,
    MarkdownTextSplitter,
    PythonCodeTextSplitter,
    HTMLHeaderTextSplitter
)
from langchain_community.vectorstores.utils import filter_complex_metadata
import chromadb
from typing import List, Optional, Any, Dict
import os
import numpy as np
import re

# 简单的演示嵌入模型（不需要API密钥）
class DemoEmbeddings(Embeddings):
    """演示用的简单嵌入模型，基于文本哈希"""
    
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """为文档列表生成嵌入向量"""
        embeddings = []
        for text in texts:
            # 使用简单的哈希和字符统计生成向量
            vector = self._text_to_vector(text)
            embeddings.append(vector)
        return embeddings
    
    def embed_query(self, text: str) -> List[float]:
        """为查询文本生成嵌入向量"""
        return self._text_to_vector(text)
    
    def _text_to_vector(self, text: str, dim: int = 384) -> List[float]:
        """将文本转换为向量（演示用简单实现）"""
        # 清理文本
        text = text.lower().strip()
        
        # 使用字符统计和简单哈希创建向量
        vector = [0.0] * dim
        
        # 基于字符频率
        char_counts = {}
        for char in text:
            if char.isalnum():
                char_counts[char] = char_counts.get(char, 0) + 1
        
        # 填充向量的前部分
        for i, (char, count) in enumerate(char_counts.items()):
            if i < dim // 2:
                vector[i] = count / len(text)
        
        # 基于单词特征填充后半部分
        words = text.split()
        for i, word in enumerate(words[:dim//4]):
            if i + dim//2 < dim:
                vector[i + dim//2] = len(word) / 10.0
        
        # 标准化向量
        magnitude = sum(x*x for x in vector) ** 0.5
        if magnitude > 0:
            vector = [x / magnitude for x in vector]
        
        return vector

class ChromaStore:
    def __init__(self, persist_directory: str = "chroma_data"):
        self.persist_directory = persist_directory
        # 使用演示嵌入模型而不是OpenAI
        self.embeddings = DemoEmbeddings()
        # 默认文本分割器配置（可以被覆盖）
        self.default_chunk_size = 1000
        self.default_chunk_overlap = 200
        
        # Ensure persist directory exists
        os.makedirs(persist_directory, exist_ok=True)
        
    def _create_text_splitter(self, splitter_type: str = "recursive", 
                             chunk_size: int = None, chunk_overlap: int = None,
                             custom_separators: str = "", length_function: str = "char_count",
                             keep_separator: bool = True, add_start_index: bool = False,
                             strip_whitespace: bool = True):
        """Create a text splitter with specified parameters and type"""
        chunk_size = chunk_size or self.default_chunk_size
        chunk_overlap = chunk_overlap or self.default_chunk_overlap
        
        # 解析自定义分隔符
        separators = None
        if custom_separators:
            try:
                separators = [sep.strip() for sep in custom_separators.split(',') if sep.strip()]
            except:
                separators = None
        
        # 根据分割器类型创建相应的文本分割器
        if splitter_type == "recursive":
            return RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                length_function=len if length_function == "char_count" else self._token_count,
                keep_separator=keep_separator,
                add_start_index=add_start_index,
                strip_whitespace=strip_whitespace,
                separators=separators if separators else ["\n\n", "\n", " ", ""],
            )
        elif splitter_type == "character":
            return CharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                length_function=len if length_function == "char_count" else self._token_count,
                keep_separator=keep_separator,
                add_start_index=add_start_index,
                strip_whitespace=strip_whitespace,
                separator=separators[0] if separators else "\n\n",
            )
        elif splitter_type == "markdown":
            return MarkdownTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                length_function=len if length_function == "char_count" else self._token_count,
                keep_separator=keep_separator,
                add_start_index=add_start_index,
                strip_whitespace=strip_whitespace,
            )
        elif splitter_type == "python":
            return PythonCodeTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                length_function=len if length_function == "char_count" else self._token_count,
                keep_separator=keep_separator,
                add_start_index=add_start_index,
                strip_whitespace=strip_whitespace,
            )
        elif splitter_type == "html":
            # HTML分割器使用标准的递归分割器
            return RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                length_function=len if length_function == "char_count" else self._token_count,
                keep_separator=keep_separator,
                add_start_index=add_start_index,
                strip_whitespace=strip_whitespace,
                separators=["<div>", "<p>", "<br>", "\n", " ", ""],
            )
        else:
            # 默认使用递归字符分割器
            return RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                length_function=len if length_function == "char_count" else self._token_count,
                keep_separator=keep_separator,
                add_start_index=add_start_index,
                strip_whitespace=strip_whitespace,
            )
    
    def _token_count(self, text: str) -> int:
        """简单的token计数实现"""
        # 这里使用简单的词语分割作为token计数
        return len(text.split())
    
    def _apply_cleaning_rules(self, text: str, cleaning_rules: List[str]) -> str:
        """应用文本清洗规则"""
        if not cleaning_rules:
            return text
        
        # 移除多余空白
        if "remove_extra_whitespace" in cleaning_rules:
            text = re.sub(r'\s+', ' ', text)
            text = text.strip()
        
        # 移除URL和邮箱
        if "remove_urls_emails" in cleaning_rules:
            # 移除URL
            text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
            # 移除邮箱
            text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '', text)
        
        # 标准化Unicode
        if "normalize_unicode" in cleaning_rules:
            import unicodedata
            text = unicodedata.normalize('NFKC', text)
        
        # 移除特殊字符
        if "remove_special_chars" in cleaning_rules:
            text = re.sub(r'[^\w\s\u4e00-\u9fff.,!?;:(){}[\]"\'`~@#$%^&*+=|\\/<>-]', '', text)
        
        # 保持文档结构（这里主要是保留段落分隔符）
        if "preserve_structure" in cleaning_rules:
            # 确保段落间有适当的分隔
            text = re.sub(r'\n{3,}', '\n\n', text)
        
        return text
        
    def create_collection(self, collection_name: str) -> Chroma:
        """Create a new Chroma collection"""
        return Chroma(
            collection_name=collection_name,
            embedding_function=self.embeddings,
            persist_directory=self.persist_directory  # 使用主目录而不是子目录
        )
    
    def add_texts(self, collection_name: str, texts: List[str], metadatas: Optional[List[dict]] = None, 
                  splitter_type: str = "recursive", chunk_size: int = None, chunk_overlap: int = None,
                  custom_separators: str = "", length_function: str = "char_count",
                  keep_separator: bool = True, add_start_index: bool = False,
                  strip_whitespace: bool = True, cleaning_rules: List[str] = None):
        """Add texts to a collection with advanced segmentation parameters"""
        try:
            collection = self.create_collection(collection_name)
            
            # Create text splitter
            text_splitter = self._create_text_splitter(
                splitter_type=splitter_type,
                chunk_size=chunk_size, 
                chunk_overlap=chunk_overlap,
                custom_separators=custom_separators,
                length_function=length_function,
                keep_separator=keep_separator,
                add_start_index=add_start_index,
                strip_whitespace=strip_whitespace
            )
            
            # Process each text and split into chunks
            all_chunks = []
            all_metadata = []
            
            for i, text in enumerate(texts):
                # Skip empty texts
                if not text or not text.strip():
                    continue
                
                # Apply cleaning rules if specified
                original_text = text
                if cleaning_rules:
                    text = self._apply_cleaning_rules(text, cleaning_rules)
                    
                # Split text into chunks
                chunks = text_splitter.split_text(text)
                all_chunks.extend(chunks)
                
                # Prepare metadata for each chunk
                if metadatas and i < len(metadatas):
                    chunk_metadata = metadatas[i]
                    for chunk_idx, chunk in enumerate(chunks):
                        # Create clean metadata dict with only basic types
                        chunk_meta = {}
                        
                        # Copy basic types from original metadata
                        for key, value in chunk_metadata.items():
                            if value is None:
                                chunk_meta[key] = ""
                            elif isinstance(value, (str, int, float, bool)):
                                chunk_meta[key] = value
                            elif isinstance(value, list):
                                # Convert list to comma-separated string
                                chunk_meta[key] = ','.join(str(item) for item in value) if value else ""
                            else:
                                # Convert other types to string
                                chunk_meta[key] = str(value)
                        
                        # Add chunk-specific metadata
                        chunk_meta.update({
                            'chunk_index': chunk_idx,
                            'total_chunks': len(chunks),
                            'chunk_size_used': chunk_size or self.default_chunk_size,
                            'chunk_overlap_used': chunk_overlap or self.default_chunk_overlap,
                            'splitter_type': splitter_type,
                            'length_function': length_function,
                            'cleaning_rules_applied': ','.join(cleaning_rules) if cleaning_rules else '',
                        })
                        all_metadata.append(chunk_meta)
                else:
                    # Default metadata for each chunk
                    for chunk_idx, chunk in enumerate(chunks):
                        all_metadata.append({
                            'chunk_index': chunk_idx,
                            'total_chunks': len(chunks),
                            'source': f'document_{i}',
                            'chunk_size_used': chunk_size or self.default_chunk_size,
                            'chunk_overlap_used': chunk_overlap or self.default_chunk_overlap,
                            'splitter_type': splitter_type,
                            'length_function': length_function,
                            'cleaning_rules_applied': '',
                        })
            
            # Add chunks to collection in batches
            if all_chunks:
                batch_size = 5000  # Safe batch size for ChromaDB
                total_chunks = len(all_chunks)
                
                print(f"Processing {total_chunks} chunks in batches of {batch_size}")
                print(f"Using splitter: {splitter_type}, chunk_size: {chunk_size or self.default_chunk_size}, chunk_overlap: {chunk_overlap or self.default_chunk_overlap}")
                
                for i in range(0, total_chunks, batch_size):
                    end_idx = min(i + batch_size, total_chunks)
                    batch_chunks = all_chunks[i:end_idx]
                    batch_metadata = all_metadata[i:end_idx] if all_metadata else None
                    
                    print(f"Adding batch {i//batch_size + 1}: chunks {i+1}-{end_idx}")
                    
                    # Add batch to collection
                    collection.add_texts(
                        texts=batch_chunks, 
                        metadatas=batch_metadata
                    )
                
                # Persist after all batches are added
                collection.persist()
                print(f"Successfully added {total_chunks} chunks to collection {collection_name}")
            else:
                print(f"No valid text chunks to add to collection {collection_name}")
                
        except Exception as e:
            print(f"Error adding texts to collection {collection_name}: {str(e)}")
            raise e
        
    def similarity_search(self, collection_name: str, query: str, k: int = 4):
        """Search for similar documents in a collection"""
        try:
            collection = self.create_collection(collection_name)
            results = collection.similarity_search(query, k=k)
            
            # 格式化搜索结果
            formatted_results = []
            for doc in results:
                result = {
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "score": 1.0,  # LangChain的similarity_search不返回分数，使用默认值
                }
                formatted_results.append(result)
            
            print(f"Search query: '{query}' returned {len(formatted_results)} results")
            return formatted_results
            
        except Exception as e:
            print(f"Error searching collection {collection_name}: {str(e)}")
            return []
    
    def delete_collection(self, collection_name: str):
        """Delete a collection"""
        try:
            client = chromadb.PersistentClient(path=self.persist_directory)
            client.delete_collection(collection_name)
            print(f"Successfully deleted collection {collection_name}")
        except Exception as e:
            print(f"Error deleting collection {collection_name}: {str(e)}")
    
    def get_document_chunks(self, collection_name: str, document_filename: str):
        """获取指定文档的所有分段"""
        try:
            # 使用一致的ChromaDB客户端路径
            client = chromadb.PersistentClient(path=self.persist_directory)
            try:
                chroma_collection = client.get_collection(collection_name)
            except Exception as e:
                print(f"Collection {collection_name} does not exist: {str(e)}")
                # 尝试列出所有可用的collections
                try:
                    collections = client.list_collections()
                    print(f"Available collections: {[c.name for c in collections]}")
                except:
                    pass
                return []
            
            chunks = []
            
            # 尝试获取所有文档并过滤
            try:
                # 首先获取所有数据 - 修复include参数
                results = chroma_collection.get(
                    include=["documents", "metadatas"]  # 移除"ids"，因为ids是默认返回的
                )
                
                if results and results.get('documents'):
                    print(f"Found {len(results['documents'])} total chunks in collection")
                    
                    # 去掉路径，只保留文件名进行匹配
                    base_filename = os.path.basename(document_filename)
                    
                    # 获取ids (默认返回)
                    ids = results.get('ids', [])
                    
                    for i, (doc_id, content, metadata) in enumerate(zip(
                        ids, 
                        results['documents'], 
                        results.get('metadatas', [])
                    )):
                        # 检查多种可能的文件名字段
                        metadata_filename = metadata.get('filename', '') if metadata else ''
                        metadata_source = metadata.get('source', '') if metadata else ''
                        
                        # 匹配逻辑：检查多种可能的文件名格式
                        is_match = False
                        
                        # 1. 直接匹配
                        if (document_filename == metadata_filename or 
                            document_filename == metadata_source):
                            is_match = True
                        
                        # 2. 基础文件名匹配
                        elif (base_filename in metadata_filename or 
                              base_filename in metadata_source):
                            is_match = True
                        
                        # 3. 检查文件名是否包含在metadata的任何字段中
                        elif base_filename in str(metadata):
                            is_match = True
                        
                        if is_match:
                            chunk = {
                                "id": doc_id or (i + 1),
                                "content": content,
                                "metadata": metadata or {},
                                "chunk_index": metadata.get('chunk_index', i) if metadata else i,
                                "word_count": len(content.split()) if content else 0,
                                "char_count": len(content) if content else 0
                            }
                            chunks.append(chunk)
                
            except Exception as e:
                print(f"Error querying collection data: {str(e)}")
                return []
            
            # 如果没有找到匹配的chunks，返回所有chunks（用于调试）
            if not chunks:
                print(f"No chunks found for document {document_filename}, returning all chunks for debugging")
                try:
                    results = chroma_collection.get(
                        include=["documents", "metadatas"]
                    )
                    
                    if results and results.get('documents'):
                        ids = results.get('ids', [])
                        for i, (doc_id, content, metadata) in enumerate(zip(
                            ids, 
                            results['documents'], 
                            results.get('metadatas', [])
                        )):
                            chunk = {
                                "id": doc_id or (i + 1),
                                "content": content,
                                "metadata": metadata or {},
                                "chunk_index": metadata.get('chunk_index', i) if metadata else i,
                                "word_count": len(content.split()) if content else 0,
                                "char_count": len(content) if content else 0
                            }
                            chunks.append(chunk)
                except Exception as e:
                    print(f"Error getting all chunks: {str(e)}")
            
            # 按chunk_index排序
            chunks.sort(key=lambda x: x.get('chunk_index', 0))
            
            print(f"Retrieved {len(chunks)} chunks for document {document_filename}")
            if chunks:
                print(f"Sample metadata: {chunks[0]['metadata']}")
            
            return chunks
            
        except Exception as e:
            print(f"Error getting document chunks for {document_filename}: {str(e)}")
            return [] 