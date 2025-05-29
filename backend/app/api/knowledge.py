from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List, Optional
import os
import uuid
from datetime import datetime
from ..services.knowledge_service import KnowledgeService
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth import get_current_user, User

router = APIRouter()
knowledge_service = KnowledgeService()

# Create upload directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Pydantic models
class SearchQuery(BaseModel):
    collection_name: str
    query: str
    k: int = 4

class CreateKnowledgeBaseRequest(BaseModel):
    name: str
    description: Optional[str] = None
    embedding_model: str = "text-embedding-ada-002"
    retrieval_model: str = "gpt-3.5-turbo"
    chunk_size: int = 1000
    chunk_overlap: int = 200
    indexing_technique: str = "high_quality"
    permission: str = "private"
    splitter_type: str = "recursive"
    length_function: str = "char_count"
    keep_separator: bool = True
    add_start_index: bool = False
    strip_whitespace: bool = True
    custom_separators: str = ""
    cleaning_rules: Optional[List[str]] = None
    metadata_fields: Optional[List[str]] = None

class KnowledgeBaseResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    owner_id: str
    embedding_model: str
    retrieval_model: str
    chunk_size: int
    chunk_overlap: int
    indexing_technique: str
    status: str = "active"
    document_count: int = 0
    word_count: int = 0
    permission: str
    created_at: str
    updated_at: str

class DocumentResponse(BaseModel):
    id: str
    knowledge_base_id: str
    name: str
    content_type: str
    size: int
    created_at: str
    updated_at: str
    chunk_count: int = 0
    word_count: int = 0
    status: str = "completed"
    tags: Optional[List[str]] = None

class KnowledgeBaseListResponse(BaseModel):
    knowledge_bases: List[KnowledgeBaseResponse]

class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]

# 模拟数据存储（实际项目中应该使用数据库）
knowledge_bases_store = {}
documents_store = {}

# 知识库管理API
@router.get("/bases")
async def list_knowledge_bases(current_user: User = Depends(get_current_user)):
    """获取知识库列表"""
    user_bases = [kb for kb in knowledge_bases_store.values() 
                  if kb["owner_id"] == current_user.username or kb["permission"] == "public"]
    
    # 重新计算每个知识库的统计信息
    for kb in user_bases:
        recalculate_kb_stats(kb["id"])
    
    return {"data": {"knowledge_bases": user_bases}}

@router.post("/bases")
async def create_knowledge_base(
    request: CreateKnowledgeBaseRequest,
    current_user: User = Depends(get_current_user)
):
    """创建知识库"""
    kb_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    knowledge_base = {
        "id": kb_id,
        "name": request.name,
        "description": request.description,
        "owner_id": current_user.username,
        "embedding_model": request.embedding_model,
        "retrieval_model": request.retrieval_model,
        "chunk_size": request.chunk_size,
        "chunk_overlap": request.chunk_overlap,
        "indexing_technique": request.indexing_technique,
        "status": "active",
        "document_count": 0,
        "word_count": 0,
        "permission": request.permission,
        "created_at": now,
        "updated_at": now,
        "splitter_type": request.splitter_type,
        "length_function": request.length_function,
        "keep_separator": request.keep_separator,
        "add_start_index": request.add_start_index,
        "strip_whitespace": request.strip_whitespace,
        "custom_separators": request.custom_separators,
        "cleaning_rules": ','.join(request.cleaning_rules) if request.cleaning_rules else "",
        "metadata_fields": request.metadata_fields,
    }
    
    knowledge_bases_store[kb_id] = knowledge_base
    return {"data": knowledge_base}

def recalculate_kb_stats(kb_id: str):
    """重新计算知识库的统计信息"""
    if kb_id not in knowledge_bases_store:
        return
    
    kb = knowledge_bases_store[kb_id]
    kb_docs = [d for d in documents_store.values() if d["knowledge_base_id"] == kb_id]
    
    # 重新计算文档数和词数
    kb["document_count"] = len(kb_docs)
    kb["word_count"] = sum(d.get("word_count", 0) for d in kb_docs)
    kb["updated_at"] = datetime.now().isoformat()

@router.get("/bases/{kb_id}")
async def get_knowledge_base(
    kb_id: str,
    current_user: User = Depends(get_current_user)
):
    """获取知识库详情"""
    if kb_id not in knowledge_bases_store:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    kb = knowledge_bases_store[kb_id]
    if kb["owner_id"] != current_user.username and kb["permission"] != "public":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # 重新计算统计信息以确保准确性
    recalculate_kb_stats(kb_id)
    
    return {"data": kb}

@router.put("/bases/{kb_id}")
async def update_knowledge_base(
    kb_id: str,
    request: CreateKnowledgeBaseRequest,
    current_user: User = Depends(get_current_user)
):
    """更新知识库"""
    if kb_id not in knowledge_bases_store:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    kb = knowledge_bases_store[kb_id]
    if kb["owner_id"] != current_user.username:
        raise HTTPException(status_code=403, detail="Access denied")
    
    kb.update({
        "name": request.name,
        "description": request.description,
        "embedding_model": request.embedding_model,
        "retrieval_model": request.retrieval_model,
        "chunk_size": request.chunk_size,
        "chunk_overlap": request.chunk_overlap,
        "indexing_technique": request.indexing_technique,
        "permission": request.permission,
        "updated_at": datetime.now().isoformat()
    })
    
    return {"data": kb}

@router.delete("/bases/{kb_id}")
async def delete_knowledge_base(
    kb_id: str,
    current_user: User = Depends(get_current_user)
):
    """删除知识库"""
    if kb_id not in knowledge_bases_store:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    kb = knowledge_bases_store[kb_id]
    if kb["owner_id"] != current_user.username:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # 删除关联的文档
    kb_docs = [doc_id for doc_id, doc in documents_store.items() 
               if doc["knowledge_base_id"] == kb_id]
    for doc_id in kb_docs:
        del documents_store[doc_id]
    
    del knowledge_bases_store[kb_id]
    return {"data": {"message": "Knowledge base deleted successfully"}}

# 文档管理API
@router.get("/bases/{kb_id}/documents")
async def list_documents(
    kb_id: str,
    current_user: User = Depends(get_current_user)
):
    """获取文档列表"""
    if kb_id not in knowledge_bases_store:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    kb = knowledge_bases_store[kb_id]
    if kb["owner_id"] != current_user.username and kb["permission"] != "public":
        raise HTTPException(status_code=403, detail="Access denied")
    
    kb_docs = [doc for doc in documents_store.values() 
               if doc["knowledge_base_id"] == kb_id]
    return {"data": {"documents": kb_docs}}

@router.post("/bases/{kb_id}/documents")
async def upload_document(
    kb_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """上传文档"""
    if kb_id not in knowledge_bases_store:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    kb = knowledge_bases_store[kb_id]
    if kb["owner_id"] != current_user.username:
        raise HTTPException(status_code=403, detail="Access denied")
    
    file_path = None
    try:
        # 保存文件
        doc_id = str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_DIR, f"{doc_id}_{file.filename}")
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # 准备处理参数，确保清洗规则是字符串类型
        kb_cleaning_rules = kb.get("cleaning_rules", "")
        if isinstance(kb_cleaning_rules, list):
            kb_cleaning_rules = ','.join(kb_cleaning_rules)
        elif not isinstance(kb_cleaning_rules, str):
            kb_cleaning_rules = str(kb_cleaning_rules) if kb_cleaning_rules else ""
        
        # 使用知识库的分段配置处理文档
        knowledge_service.process_document(
            file_path=file_path,
            collection_name=kb_id,
            metadata={"filename": file.filename, "uploaded_by": current_user.username},
            chunk_size=kb.get("chunk_size", 1000),
            chunk_overlap=kb.get("chunk_overlap", 200),
            splitter_type=kb.get("splitter_type", "recursive"),
            custom_separators=kb.get("custom_separators", ""),
            length_function=kb.get("length_function", "char_count"),
            keep_separator=kb.get("keep_separator", True),
            add_start_index=kb.get("add_start_index", False),
            strip_whitespace=kb.get("strip_whitespace", True),
            cleaning_rules=kb_cleaning_rules
        )
        
        # 创建文档记录
        now = datetime.now().isoformat()
        
        # 计算准确的词数
        try:
            # 先尝试UTF-8解码
            text_content = content.decode('utf-8')
        except UnicodeDecodeError:
            # 如果失败，使用错误处理模式
            text_content = content.decode('utf-8', errors='ignore')
        
        # 对于中英文混合文本，使用字符数除以平均字符数来估算词数
        import re
        # 计算英文单词数
        english_words = len(re.findall(r'\b[a-zA-Z]+\b', text_content))
        # 计算中文字符数（中文字符通常一个字符就是一个词）
        chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', text_content))
        # 总词数 = 英文单词数 + 中文字符数
        total_word_count = english_words + chinese_chars
        
        document = {
            "id": doc_id,
            "knowledge_base_id": kb_id,
            "name": file.filename,
            "content_type": file.content_type or "application/octet-stream",
            "size": len(content),
            "created_at": now,
            "updated_at": now,
            "chunk_count": 1,  # 简化，实际应该计算
            "word_count": total_word_count,
            "status": "completed",
            "tags": []
        }
        
        documents_store[doc_id] = document
        
        # 更新知识库统计
        recalculate_kb_stats(kb_id)
        
        return {"data": document}
    
    except Exception as e:
        print(f"Error processing document {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Document processing failed: {str(e)}")
    finally:
        # 清理临时文件
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Warning: Failed to remove temporary file {file_path}: {str(e)}")

@router.delete("/bases/{kb_id}/documents/{doc_id}")
async def delete_document(
    kb_id: str,
    doc_id: str,
    current_user: User = Depends(get_current_user)
):
    """删除文档"""
    if kb_id not in knowledge_bases_store:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    if doc_id not in documents_store:
        raise HTTPException(status_code=404, detail="Document not found")
    
    kb = knowledge_bases_store[kb_id]
    if kb["owner_id"] != current_user.username:
        raise HTTPException(status_code=403, detail="Access denied")
    
    del documents_store[doc_id]
    
    # 更新知识库统计
    kb_docs = [d for d in documents_store.values() if d["knowledge_base_id"] == kb_id]
    kb["document_count"] = len(kb_docs)
    kb["word_count"] = sum(d.get("word_count", 0) for d in kb_docs)  # 累加所有文档的词数
    kb["updated_at"] = datetime.now().isoformat()
    
    return {"data": {"message": "Document deleted successfully"}}

# 搜索API
@router.post("/bases/search")
async def search_knowledge_base(
    search_params: dict,
    current_user: User = Depends(get_current_user)
):
    """搜索知识库"""
    try:
        kb_id = search_params.get("knowledge_base_id")
        query = search_params.get("query")
        limit = search_params.get("limit", 4)
        
        if not kb_id or not query:
            raise HTTPException(status_code=400, detail="Missing required parameters")
        
        if kb_id not in knowledge_bases_store:
            raise HTTPException(status_code=404, detail="Knowledge base not found")
        
        kb = knowledge_bases_store[kb_id]
        if kb["owner_id"] != current_user.username and kb["permission"] != "public":
            raise HTTPException(status_code=403, detail="Access denied")
        
        results = knowledge_service.search_knowledge_base(
            collection_name=kb_id,
            query=query,
            k=limit
        )
        
        return {"data": {"results": results}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 索引进度API  
@router.get("/bases/{kb_id}/indexing-progress")
async def get_indexing_progress(
    kb_id: str,
    current_user: User = Depends(get_current_user)
):
    """获取索引进度"""
    if kb_id not in knowledge_bases_store:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    # 简化实现，返回完成状态
    return {
        "data": {
            "progress": {
                "total": 1,
                "processed": 1,
                "status": "completed"
            }
        }
    }

# 保持原有的简单API以兼容
@router.post("/upload/{collection_name}")
async def upload_document_simple(
    collection_name: str,
    file: UploadFile = File(...),
    metadata: dict = None
):
    """简单上传文档API（兼容性）"""
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

@router.get("/bases/{kb_id}/documents/{doc_id}/chunks")
async def get_document_chunks(
    kb_id: str,
    doc_id: str,
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_user)
):
    """获取文档的分段内容（支持分页）"""
    if kb_id not in knowledge_bases_store:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    if doc_id not in documents_store:
        raise HTTPException(status_code=404, detail="Document not found")
    
    kb = knowledge_bases_store[kb_id]
    doc = documents_store[doc_id]
    
    if kb["owner_id"] != current_user.username and kb["permission"] != "public":
        raise HTTPException(status_code=403, detail="Access denied")
    
    if doc["knowledge_base_id"] != kb_id:
        raise HTTPException(status_code=400, detail="Document does not belong to this knowledge base")
    
    try:
        # 从向量数据库获取文档的分段（支持分页）
        result = knowledge_service.get_document_chunks_paginated(
            collection_name=kb_id,
            document_filename=doc["name"],
            page=page,
            page_size=page_size
        )
        
        return {"data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search")
async def search_knowledge_base_simple(query: SearchQuery):
    """简单搜索API（兼容性）"""
    try:
        results = knowledge_service.search_knowledge_base(
            collection_name=query.collection_name,
            query=query.query,
            k=query.k
        )
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 