from typing import TypedDict, Optional

class MindJournal(TypedDict):
    query:             str
    user_id:           int        # ← must be here
    orchestration:     Optional[dict]
    sentiment_result:  Optional[dict]
    pattern_result:    Optional[dict]
    insight_result:    Optional[dict]
    knowledge_updated: Optional[bool]
    memory_saved:      Optional[bool]