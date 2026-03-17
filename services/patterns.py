from langchain_google_genai import ChatGoogleGenerativeAI
from utils.state import MindJournal
from pydantic import BaseModel, Field

# pydantic class for structured output
class PatternStructure(BaseModel):
    recurring_themes: list[str] = Field(description="Life themes present in the entry")
    people_mentioned: list[str] = Field(description="People or relationships mentioned")
    goals_mentioned: list[str] = Field(description="Goals, habits, or intentions mentioned")
    goal_drift: bool = Field(description="True if user indicates abandoning a goal")
    knowledge_entities: list[str] = Field(description="Important concepts worth storing in long term memory")

# Calling llm
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0
)

# Structured Output
pattern_llm = llm.with_structured_output(PatternStructure)


# pydantic class
def pattern_analysis(state: MindJournal) -> MindJournal:

    query             = state["query"]
    context           = state["orchestration"]["context_for_tools"]
    emotional_summary = state["orchestration"]["emotional_summary"]
    sentiment         = state["sentiment_result"]


# Prompt 
    prompt = f"""
You are an expert behavioral analyst and psychologist specializing in identifying life patterns from personal journals.

This entry is part of a long-term AI-assisted self-reflection system.

Planner context:
{context}

Emotional summary:
{emotional_summary}

Sentiment analysis results:
Primary emotion: {sentiment['primary_emotion']}
Cognitive distortions: {sentiment['cognitive_distortions']}

Journal Entry:
\"\"\"{query}\"\"\"


Your task:

1. Identify recurring life themes.
2. Identify people or relationships mentioned.
3. Identify goals, habits, or intentions mentioned.
4. Detect goal drift if the user indicates abandoning something important.
5. Extract knowledge entities that should be stored in a personal knowledge graph.

Rules:

Recurring themes examples:
- work stress
- self improvement
- relationships
- mental health
- productivity

People examples:
- friend
- manager
- mother
- teammate

Goals examples:
- study regularly
- exercise more
- build a startup
- reduce procrastination

Knowledge entities should include:
important concepts related to the user's life such as:
exams, gym, coding, sleep, anxiety, deadlines, startup, health

Do NOT include trivial nouns.

Return only structured data following the schema.
"""

    response = pattern_llm.invoke(prompt)

    return {
        **state,
        "pattern_result": response.model_dump()
    }