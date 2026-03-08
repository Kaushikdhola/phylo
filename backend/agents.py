# backend/agents.py
import anthropic
import json
import os
from dotenv import load_dotenv
from models import Idea

load_dotenv(dotenv_path="../.env")
client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# ─────────────────────────────────────────
# AGENT 1: Generator
# Creates fresh ideas from the seed problem
# ─────────────────────────────────────────
async def generator_agent(problem: str, count: int = 6) -> list[str]:
    """
    Returns a list of raw idea strings.
    """
    prompt = f"""You are a radical idea generator in an evolutionary idea competition.

PROBLEM: {problem}

Generate exactly {count} completely different, creative hypotheses or solutions to this problem.
Each idea should be genuinely distinct — different mechanism, different angle, different assumption.
Be bold. Be specific. Avoid clichés.

Return ONLY a JSON array of strings. No preamble, no explanation.
Example format:
["Idea one here", "Idea two here", "Idea three here"]

Generate {count} ideas now:"""

    response = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = response.content[0].text.strip()
    # Strip markdown code fences if model adds them
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    ideas = json.loads(raw.strip())
    return ideas[:count]


# ─────────────────────────────────────────
# AGENT 2: Judge
# Scores a single idea for fitness
# ─────────────────────────────────────────
async def judge_agent(problem: str, idea_text: str) -> float:
    """
    Returns a float score between 0.0 and 1.0.
    Criteria: novelty, feasibility, impact, specificity.
    """
    prompt = f"""You are an impartial scientific judge evaluating ideas in an evolutionary competition.

ORIGINAL PROBLEM: {problem}

IDEA TO EVALUATE:
{idea_text}

Score this idea on a scale from 0.0 to 1.0 based on:
- Novelty (is this genuinely new thinking?)
- Feasibility (could this actually work?)
- Impact (would this significantly solve the problem?)
- Specificity (is this concrete, not vague?)

Return ONLY a single float number between 0.0 and 1.0. Nothing else.
Example: 0.73

Your score:"""

    response = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=10,
        messages=[{"role": "user", "content": prompt}]
    )

    score_str = response.content[0].text.strip()
    score = float(score_str)
    return max(0.0, min(1.0, score))  # clamp to [0,1]


# ─────────────────────────────────────────
# AGENT 3: Mutator
# Takes one idea and produces a mutated variant
# ─────────────────────────────────────────
async def mutator_agent(problem: str, parent_idea: str) -> str:
    """
    Returns a single mutated idea string.
    """
    prompt = f"""You are a mutation agent in an evolutionary idea system.

ORIGINAL PROBLEM: {problem}

PARENT IDEA (to mutate):
{parent_idea}

Your job: produce ONE mutated child idea.
Mutation means: keep the core insight but change ONE key assumption, mechanism, or scope.
The mutation should be meaningful — not just rephrasing, but a genuine conceptual twist.

Return ONLY the mutated idea as a single string. No preamble.

Mutated idea:"""

    response = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}]
    )

    return response.content[0].text.strip()


# ─────────────────────────────────────────
# AGENT 4: Crossbreeder
# Takes two ideas and hybridizes them
# ─────────────────────────────────────────
async def crossbreeder_agent(problem: str, parent_a: str, parent_b: str) -> str:
    """
    Returns a single hybrid idea string.
    """
    prompt = f"""You are a crossbreeding agent in an evolutionary idea system.

ORIGINAL PROBLEM: {problem}

PARENT IDEA A:
{parent_a}

PARENT IDEA B:
{parent_b}

Your job: produce ONE hybrid child idea that genuinely combines the best elements of both parents.
This is not a summary — it is a synthesis. Find where both ideas can reinforce each other in a new way.

Return ONLY the hybrid idea as a single string. No preamble.

Hybrid idea:"""

    response = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}]
    )

    return response.content[0].text.strip()
