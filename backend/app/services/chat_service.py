from langchain_openai import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from typing import List, Dict, Any, Optional
from ..vectorstore.chroma_store import ChromaStore
import uuid
import os
from fastapi import UploadFile
import aiofiles
import mimetypes

class ChatService:
    def __init__(self):
        self.vector_store = ChromaStore()
        self.chat_model = ChatOpenAI(temperature=0.7)
        self.conversations: Dict[str, Any] = {}
        self.messages: Dict[str, Dict[str, Any]] = {}
        self.upload_dir = "uploads"
        os.makedirs(self.upload_dir, exist_ok=True)
        
    async def save_file(self, file: UploadFile) -> Dict[str, Any]:
        """Save an uploaded file and return its metadata"""
        file_id = str(uuid.uuid4())
        file_path = os.path.join(self.upload_dir, file_id)
        
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
            
        mime_type = file.content_type or mimetypes.guess_type(file.filename)[0]
        file_type = 'file'
        if mime_type and mime_type.startswith('image/'):
            file_type = 'image'
        elif mime_type and mime_type.startswith('audio/'):
            file_type = 'audio'
            
        return {
            "id": file_id,
            "type": file_type,
            "name": file.filename,
            "url": f"/uploads/{file_id}",
            "size": len(content),
            "mime_type": mime_type,
            "created_at": str(uuid.uuid4())
        }
        
    def create_conversation(self, conversation_id: str, collection_name: str):
        """Create a new conversation with knowledge base context"""
        # Get vector store
        vectorstore = self.vector_store.create_collection(collection_name)
        
        # Create memory
        memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        
        # Create chain
        chain = ConversationalRetrievalChain.from_llm(
            llm=self.chat_model,
            retriever=vectorstore.as_retriever(),
            memory=memory,
            return_source_documents=True
        )
        
        self.conversations[conversation_id] = {
            "chain": chain,
            "memory": memory
        }
        
    async def chat(self, conversation_id: str, message: str, files: Optional[List[UploadFile]] = None) -> Dict[str, Any]:
        """Process a chat message with optional file attachments"""
        if conversation_id not in self.conversations:
            raise ValueError(f"Conversation {conversation_id} not found")
            
        conversation = self.conversations[conversation_id]
        
        # Process files if any
        attachments = []
        if files:
            for file in files:
                attachment = await self.save_file(file)
                attachments.append(attachment)
        
        # Process message
        response = conversation["chain"]({"question": message})
        
        # Store message
        message_id = str(uuid.uuid4())
        self.messages[message_id] = {
            "conversation_id": conversation_id,
            "content": message,
            "response": response,
            "attachments": attachments
        }
        
        return {
            "answer": response["answer"],
            "sources": [
                {
                    "content": doc.page_content,
                    "metadata": doc.metadata
                }
                for doc in response["source_documents"]
            ],
            "attachments": attachments
        }
        
    def update_message(self, message_id: str, content: str) -> Dict[str, Any]:
        """Update a message"""
        if message_id not in self.messages:
            raise ValueError(f"Message {message_id} not found")
            
        message = self.messages[message_id]
        conversation_id = message["conversation_id"]
        
        if conversation_id not in self.conversations:
            raise ValueError(f"Conversation {conversation_id} not found")
            
        # Update message content
        message["content"] = content
        
        # Reprocess message
        conversation = self.conversations[conversation_id]
        response = conversation["chain"]({"question": content})
        message["response"] = response
        
        return {
            "id": message_id,
            "conversation_id": conversation_id,
            "content": content,
            "response": response,
            "attachments": message.get("attachments", [])
        }
        
    def delete_message(self, message_id: str):
        """Delete a message"""
        if message_id not in self.messages:
            raise ValueError(f"Message {message_id} not found")
            
        # Delete associated files
        message = self.messages[message_id]
        if "attachments" in message:
            for attachment in message["attachments"]:
                file_path = os.path.join(self.upload_dir, attachment["id"])
                if os.path.exists(file_path):
                    os.remove(file_path)
                    
        del self.messages[message_id]
        
    def delete_conversation(self, conversation_id: str):
        """Delete a conversation"""
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]
            
        # Delete all messages in the conversation
        message_ids = [
            msg_id for msg_id, msg in self.messages.items()
            if msg["conversation_id"] == conversation_id
        ]
        for msg_id in message_ids:
            self.delete_message(msg_id) 