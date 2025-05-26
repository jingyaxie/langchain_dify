from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import os
from ..services.knowledge_service import KnowledgeService
from pydantic import BaseModel

router = APIRouter()
knowledge_service = KnowledgeService()

# Create upload directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class SearchQuery(BaseModel):
    collection_name: str
    query: str
    k: int = 4

@router.post("/upload/{collection_name}")
async def upload_document(
    collection_name: str,
    file: UploadFile = File(...),
    metadata: dict = None
):
    """Upload a document to the knowledge base"""
    try:
        # Save file temporarily
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Process document
        knowledge_service.process_document(
            file_path=file_path,
            collection_name=collection_name,
            metadata=metadata
        )
        
        # Clean up
        os.remove(file_path)
        
        return {"message": "Document processed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search")
async def search_knowledge_base(query: SearchQuery):
    """Search the knowledge base"""
    try:
        results = knowledge_service.search_knowledge_base(
            collection_name=query.collection_name,
            query=query.query,
            k=query.k
        )
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 