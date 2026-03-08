# backend/models.py
from pydantic import BaseModel
from typing import Optional
import uuid

class Idea(BaseModel):
    id: str = ""
    text: str
    score: float = 0.0
    generation: int = 0
    parents: list[str] = []
    status: str = "alive"   # "alive" | "dead" | "champion"
    agent_type: str = "generator"

    def __init__(self, **data):
        super().__init__(**data)
        if not self.id:
            self.id = str(uuid.uuid4())[:8]

class SeedRequest(BaseModel):
    problem: str
    generations: int = 5
    population_size: int = 6   # ideas per generation

class EvolutionEvent(BaseModel):
    event_type: str   # "new_idea" | "idea_scored" | "idea_died" | "generation_complete" | "champion"
    idea: Optional[Idea] = None
    generation: int = 0
    message: str = ""
