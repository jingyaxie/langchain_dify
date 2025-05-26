from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List, Dict
import uuid
from ..services.chat_service import ChatService

router = APIRouter()
chat_service = ChatService()

class ChatMessage(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    collection_name: Optional[str] = None

class ChatResponse(BaseModel):
    conversation_id: str
    answer: str
    sources: List[Dict]
    attachments: Optional[List[Dict]] = None

class MessageUpdate(BaseModel):
    content: str

@router.post("/message", response_model=ChatResponse)
async def chat(
    message: str = Form(...),
    conversation_id: Optional[str] = Form(None),
    collection_name: Optional[str] = Form(None),
    files: List[UploadFile] = File(None)
):
    """Process a chat message with optional file attachments"""
    try:
        # Create new conversation if needed
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
            if collection_name:
                chat_service.create_conversation(
                    conversation_id,
                    collection_name
                )
        
        # Process message and files
        response = chat_service.chat(
            conversation_id,
            message,
            files
        )
        
        return {
            "conversation_id": conversation_id,
            **response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/message/{message_id}")
async def update_message(message_id: str, update: MessageUpdate):
    """Update a message"""
    try:
        updated_message = chat_service.update_message(message_id, update.content)
        return {"message": updated_message}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/message/{message_id}")
async def delete_message(message_id: str):
    """Delete a message"""
    try:
        chat_service.delete_message(message_id)
        return {"success": True, "message": "Message deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/conversation/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation"""
    try:
        chat_service.delete_conversation(conversation_id)
        return {"message": "Conversation deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 