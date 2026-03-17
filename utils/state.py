from langgraph.graph import StateGraph,START,END
from pydantic import BaseModel
from typing import TypedDict,Optional

class MindJournal(TypedDict):
    query: str
    orchestration:Optional[dict]
    sentiment_result:Optional[dict]
    pattern_result:Optional[dict]
    insight_result:Optional[dict]
    memory_saved:Optional[bool]
    graph_updated:Optional[bool]

