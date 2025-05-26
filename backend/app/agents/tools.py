from typing import Optional, Type
from langchain.tools import (
    Tool,
    DuckDuckGoSearchRun,
    PythonREPLTool,
    RequestsGetTool,
    RequestsPostTool,
    BaseTool
)
from langchain_community.tools import (
    WikipediaQueryRun,
    WolframAlphaQueryRun,
    ArxivAPIWrapper,
    PubmedQueryRun
)
from langchain_community.utilities import (
    WikipediaAPIWrapper,
    WolframAlphaAPIWrapper,
    ArxivAPIWrapper as ArxivWrapper,
    PubmedAPIWrapper
)

class KnowledgeBaseTool(BaseTool):
    name = "knowledge_base_search"
    description = "Search the knowledge base for relevant information"
    
    def __init__(self, vector_store):
        super().__init__()
        self.vector_store = vector_store
        
    def _run(self, query: str) -> str:
        results = self.vector_store.similarity_search(query)
        return "\n".join([doc.page_content for doc in results])

def get_default_tools() -> List[Tool]:
    """Get a list of default tools for agents."""
    return [
        Tool(
            name="Search",
            func=DuckDuckGoSearchRun().run,
            description="Search the web for current events and information"
        ),
        Tool(
            name="Python",
            func=PythonREPLTool().run,
            description="Run Python code"
        ),
        Tool(
            name="HTTP Get",
            func=RequestsGetTool().run,
            description="Make HTTP GET requests"
        ),
        Tool(
            name="HTTP Post",
            func=RequestsPostTool().run,
            description="Make HTTP POST requests"
        ),
        Tool(
            name="Wikipedia",
            func=WikipediaQueryRun(api_wrapper=WikipediaAPIWrapper()).run,
            description="Search Wikipedia for information"
        ),
        Tool(
            name="Wolfram Alpha",
            func=WolframAlphaQueryRun(api_wrapper=WolframAlphaAPIWrapper()).run,
            description="Get answers to mathematical and scientific questions"
        ),
        Tool(
            name="Arxiv",
            func=ArxivAPIWrapper().run,
            description="Search academic papers on Arxiv"
        ),
        Tool(
            name="PubMed",
            func=PubmedQueryRun(api_wrapper=PubmedAPIWrapper()).run,
            description="Search medical research papers on PubMed"
        )
    ]

def get_tool_by_name(tool_name: str) -> Optional[Tool]:
    """Get a specific tool by name."""
    tools = get_default_tools()
    for tool in tools:
        if tool.name == tool_name:
            return tool
    return None 