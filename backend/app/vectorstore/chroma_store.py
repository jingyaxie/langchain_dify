from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
import chromadb
from typing import List, Optional
import os

class ChromaStore:
    def __init__(self, persist_directory: str = "data/chroma"):
        self.persist_directory = persist_directory
        self.embeddings = OpenAIEmbeddings()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        
        # Ensure persist directory exists
        os.makedirs(persist_directory, exist_ok=True)
        
    def create_collection(self, collection_name: str) -> Chroma:
        """Create a new Chroma collection"""
        return Chroma(
            collection_name=collection_name,
            embedding_function=self.embeddings,
            persist_directory=os.path.join(self.persist_directory, collection_name)
        )
    
    def add_texts(self, collection_name: str, texts: List[str], metadatas: Optional[List[dict]] = None):
        """Add texts to a collection"""
        collection = self.create_collection(collection_name)
        chunks = self.text_splitter.split_text(texts)
        
        if metadatas:
            collection.add_texts(texts=chunks, metadatas=metadatas)
        else:
            collection.add_texts(texts=chunks)
            
        collection.persist()
        
    def similarity_search(self, collection_name: str, query: str, k: int = 4):
        """Search for similar documents in a collection"""
        collection = self.create_collection(collection_name)
        return collection.similarity_search(query, k=k)
    
    def delete_collection(self, collection_name: str):
        """Delete a collection"""
        client = chromadb.PersistentClient(path=self.persist_directory)
        client.delete_collection(collection_name) 