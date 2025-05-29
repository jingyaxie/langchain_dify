#!/usr/bin/env python3
"""
测试脚本：验证新的文档分段功能
"""

import sys
import os

# 添加后端目录到Python路径
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

def test_basic_chunking():
    """测试基本分块功能"""
    print("🧪 测试知识库分段功能")
    print("=" * 50)
    
    try:
        from app.vectorstore.chroma_store import ChromaStore
        from app.services.knowledge_service import KnowledgeService
        
        # 创建测试文本
        test_text = """
        # Python编程基础

        Python是一种高级编程语言，由Guido van Rossum在1989年发明。

        ## 变量和数据类型

        Python支持多种数据类型：
        - 字符串 (str)
        - 整数 (int)
        - 浮点数 (float)
        - 布尔值 (bool)

        ## 函数定义

        在Python中，使用def关键字定义函数：

        ```python
        def hello_world():
            print("Hello, World!")
            return "Hello"
        
        def add_numbers(a, b):
            return a + b
        ```

        ## 类和对象

        Python是面向对象的编程语言：

        ```python
        class Person:
            def __init__(self, name):
                self.name = name
            
            def greet(self):
                return f"Hello, I'm {self.name}"
        ```

        这是一个很长的文档，用来测试不同的分段策略和清洗规则的效果。
        """
        
        # 创建临时文件
        test_file = "test_document.md"
        with open(test_file, 'w', encoding='utf-8') as f:
            f.write(test_text)
        
        try:
            # 测试ChromaStore的基本功能
            print("\n📋 测试 1: 基本递归分割器")
            print("-" * 40)
            
            store = ChromaStore()
            
            # 直接测试文本分割
            text_splitter = store._create_text_splitter(
                splitter_type="recursive",
                chunk_size=500,
                chunk_overlap=100
            )
            
            chunks = text_splitter.split_text(test_text)
            print(f"✅ 成功创建 {len(chunks)} 个分块")
            
            # 显示分块信息
            for i, chunk in enumerate(chunks[:3]):
                print(f"\n  分块 {i+1}:")
                print(f"    长度: {len(chunk)} 字符")
                print(f"    内容预览: {chunk[:100].strip()}...")
            
            if len(chunks) > 3:
                print(f"  ... 还有 {len(chunks) - 3} 个分块")
            
            print("\n📋 测试 2: Markdown分割器")
            print("-" * 40)
            
            markdown_splitter = store._create_text_splitter(
                splitter_type="markdown",
                chunk_size=300,
                chunk_overlap=50
            )
            
            md_chunks = markdown_splitter.split_text(test_text)
            print(f"✅ 成功创建 {len(md_chunks)} 个分块")
            
            for i, chunk in enumerate(md_chunks[:3]):
                print(f"\n  分块 {i+1}:")
                print(f"    长度: {len(chunk)} 字符")
                print(f"    内容预览: {chunk[:100].strip()}...")
            
            print("\n📋 测试 3: 清洗规则")
            print("-" * 40)
            
            # 测试清洗规则
            dirty_text = "  这是一个   有很多   空格的   文档。  \n\n\n\n  还有很多换行符。  "
            cleaned_text = store._apply_cleaning_rules(dirty_text, ["remove_extra_whitespace"])
            
            print(f"原文本: '{dirty_text}'")
            print(f"清洗后: '{cleaned_text}'")
            print(f"长度变化: {len(dirty_text)} -> {len(cleaned_text)}")
            
            print(f"\n🎉 基本分段功能测试完成！")
            
        finally:
            # 清理测试文件
            if os.path.exists(test_file):
                os.remove(test_file)
                
    except ImportError as e:
        print(f"❌ 导入错误: {e}")
        print("请确保后端环境已正确设置")
    except Exception as e:
        print(f"❌ 测试失败: {e}")

if __name__ == "__main__":
    test_basic_chunking() 