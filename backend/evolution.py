# backend/evolution.py
import asyncio
import random
from models import Idea, EvolutionEvent
from agents import generator_agent, judge_agent, mutator_agent, crossbreeder_agent
from typing import Callable, Awaitable

# broadcast_fn is an async callback — the WebSocket sender
async def run_evolution(
    problem: str,
    generations: int,
    population_size: int,
    broadcast: Callable[[EvolutionEvent], Awaitable[None]]
):
    population: list[Idea] = []
    all_ideas: list[Idea] = []  # full history including dead

    # ── GENERATION 0: Seed the population ──
    await broadcast(EvolutionEvent(
        event_type="generation_complete",
        generation=0,
        message=f"🌱 Generator Agent is creating {population_size} initial ideas..."
    ))

    raw_ideas = await generator_agent(problem, count=population_size)

    for i, raw_text in enumerate(raw_ideas):
        idea = Idea(text=raw_text, generation=0, agent_type="generator")

        await broadcast(EvolutionEvent(event_type="new_idea", idea=idea, generation=0,
                                       message=f"Generated idea {i+1}/{population_size}: {raw_text[:80]}..."))

        score = await judge_agent(problem, raw_text)
        idea.score = score

        await broadcast(EvolutionEvent(event_type="idea_scored", idea=idea, generation=0,
                                       message=f"Scored {score:.2f} — {'strong' if score > 0.7 else 'moderate' if score > 0.4 else 'weak'} fitness"))

        population.append(idea)
        all_ideas.append(idea)

    # ── GENERATION 1 to N ──
    for gen in range(1, generations + 1):
        await broadcast(EvolutionEvent(
            event_type="generation_complete",
            generation=gen,
            message=f"🧬 Generation {gen}/{generations} — Natural selection begins..."
        ))

        # Selection: sort by score, keep top 50%
        population.sort(key=lambda x: x.score, reverse=True)
        survivors_count = max(2, len(population) // 2)
        survivors = population[:survivors_count]
        dead = population[survivors_count:]

        # Kill weak ideas
        for idea in dead:
            idea.status = "dead"
            await broadcast(EvolutionEvent(event_type="idea_died", idea=idea, generation=gen,
                                           message=f"💀 Eliminated (score {idea.score:.2f}): {idea.text[:60]}..."))

        # Reproduction: fill population back up
        children: list[Idea] = []

        # Half children = mutations of survivors
        for i in range(population_size // 2):
            parent = random.choice(survivors)
            mutated_text = await mutator_agent(problem, parent.text)
            child = Idea(
                text=mutated_text,
                generation=gen,
                parents=[parent.id],
                agent_type="mutator"
            )
            await broadcast(EvolutionEvent(event_type="new_idea", idea=child, generation=gen,
                                           message=f"🔬 Mutator Agent twisted idea {parent.id}: {mutated_text[:70]}..."))
            score = await judge_agent(problem, mutated_text)
            child.score = score
            await broadcast(EvolutionEvent(event_type="idea_scored", idea=child, generation=gen,
                                           message=f"Scored {score:.2f} — {'strong' if score > 0.7 else 'moderate' if score > 0.4 else 'weak'} fitness"))
            children.append(child)
            all_ideas.append(child)

        # Half children = crossbreeds of two survivors
        for i in range(population_size // 2):
            if len(survivors) < 2:
                break
            parent_a, parent_b = random.sample(survivors, 2)
            hybrid_text = await crossbreeder_agent(problem, parent_a.text, parent_b.text)
            child = Idea(
                text=hybrid_text,
                generation=gen,
                parents=[parent_a.id, parent_b.id],
                agent_type="crossbreeder"
            )
            await broadcast(EvolutionEvent(event_type="new_idea", idea=child, generation=gen,
                                           message=f"⚗️ Crossbreeder Agent merged {parent_a.id} + {parent_b.id}: {hybrid_text[:70]}..."))
            score = await judge_agent(problem, hybrid_text)
            child.score = score
            await broadcast(EvolutionEvent(event_type="idea_scored", idea=child, generation=gen,
                                           message=f"Scored {score:.2f} — {'strong' if score > 0.7 else 'moderate' if score > 0.4 else 'weak'} fitness"))
            children.append(child)
            all_ideas.append(child)

        population = survivors + children

    # ── FINAL: Crown the champion ──
    champion = max(all_ideas, key=lambda x: x.score)
    champion.status = "champion"
    await broadcast(EvolutionEvent(
        event_type="champion",
        idea=champion,
        generation=generations,
        message=f"🏆 Champion: {champion.text[:80]}... (score: {champion.score:.2f})"
    ))
