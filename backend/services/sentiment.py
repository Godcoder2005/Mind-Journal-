from langchain_google_genai import ChatGoogleGenerativeAI
from utils.state import MindJournal
from pydantic import BaseModel,Field
from datetime import datetime

class sentiment_structure(BaseModel):
    energy_score: int = Field(ge=1, le=10)
    mood: str
    primary_emotion: str
    cognitive_distortions: list[str]
    sentiment_score: float = Field(ge=-1.0, le=1.0)

# Calling the llm
llm = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite-preview",temperature=0)


# llms structured output using pydantic
structured_llm = llm.with_structured_output(sentiment_structure)

def Sentiment_analysis(state : MindJournal)-> MindJournal:
     query = state['query']
     context = state['orchestration']['context_for_tools']
     emotional_summary = state['orchestration']['emotional_summary']

     prompt = f"""
You are an expert in cognitive behavioral therapy and emotional analysis.
You have 10+ years of experience identifying emotional patterns in human writing.

The planning agent has already read this entry and noted:
- Emotional summary: {emotional_summary}
- Context: {context}

Now analyze this journal entry in depth:
\"\"\"{query}\"\"\"

Return ONLY this JSON:
{{
  "energy_score": <integer 1-10>,
  "mood": "<positive | negative | neutral | mixed>",
  "primary_emotion": "<single dominant emotion>",
  "cognitive_distortions": ["<list any: catastrophizing | all-or-nothing | self-blame | mind-reading | overgeneralization | none>"],
  "sentiment_score": <float -1.0 to 1.0>
}}

STRICT RULES:
- Return ONLY JSON. No extra text.
- energy_score 1 = completely drained, 10 = highly energized
- sentiment_score -1 = very negative, 0 = neutral, 1 = very positive
- cognitive_distortions must always be a list
"""
     
     response = structured_llm.invoke(prompt)
     result = response.model_dump()
     result["timestamp"] = datetime.now().isoformat()

     return {
        **state,
        "sentiment_result": result
    }