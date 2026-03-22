from typing import TypedDict, Optional

class MindJournal(TypedDict):
    query:             str
    user_id:           Optional[int]    # allowing None for anonymous sessions
    stage:             str    
    orchestration:     Optional[dict]
    sentiment_result:  Optional[dict]
    pattern_result:    Optional[dict]
    insight_result:    Optional[dict]
    knowledge_updated: Optional[bool]
    memory_saved:      Optional[bool]