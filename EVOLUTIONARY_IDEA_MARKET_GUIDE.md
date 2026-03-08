# 🧬 The Evolutionary Idea Market — Complete Vibe Coding Guide
> Built for VS Code + Claude Opus | Author: Your AI Pair Programmer
> Difficulty: Intermediate | Time: 1 full Sunday (~6–8 hrs)

---

## 🧠 What You're Building

A web app where AI agents **compete like species in Darwinian evolution** to solve a problem.

- You type a **seed problem** (e.g. "How do we fix urban loneliness?")
- AI agents generate **competing hypotheses** (the "organisms")
- A **Judge Agent** scores each idea (fitness function)
- Weak ideas **die**. Strong ideas **reproduce** (mutate + crossbreed)
- The entire ecosystem is **visualized as a living force-directed graph** in real time
- After N generations, the **fittest idea survives**

**This is genuinely novel**: it applies genetic algorithm philosophy to LLM-driven ideation, visualized in real time. Nobody on LinkedIn has built this exact thing.

---

## 🗂️ Final Folder Structure

```
evolutionary-idea-market/
├── backend/
│   ├── main.py               # FastAPI app + WebSocket
│   ├── agents.py             # All agent logic (Generator, Mutator, Crossbreeder, Judge)
│   ├── evolution.py          # Evolution loop (selection, reproduction, death)
│   ├── models.py             # Pydantic data models
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx          # React entry
│   │   ├── App.jsx           # Root component
│   │   ├── components/
│   │   │   ├── GraphCanvas.jsx     # D3 force graph
│   │   │   ├── IdeaPanel.jsx       # Selected node detail
│   │   │   ├── ControlPanel.jsx    # Seed input + controls
│   │   │   └── Leaderboard.jsx     # Top ideas ranked
│   │   └── hooks/
│   │       └── useEvolution.js     # WebSocket state hook
│   ├── package.json
│   └── vite.config.js
├── .env                      # ANTHROPIC_API_KEY
└── README.md
```

---

## ⚙️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend | Python + FastAPI | Async WebSocket support, fast |
| AI | Anthropic Claude API (claude-opus-4-5) | Best reasoning for creative idea generation |
| Frontend | React + Vite | Fast dev server, modern |
| Graph Viz | D3.js (force-directed) | The living graph — the whole visual spectacle |
| Styling | Tailwind CSS | Fast, clean dark UI |
| Communication | WebSocket | Real-time graph updates without polling |

---

## 📋 Prerequisites

Install these before starting:

```bash
# Python
python --version   # Need 3.10+

# Node
node --version     # Need 18+
npm --version

# Install global tools
npm install -g vite

# Anthropic SDK
pip install anthropic fastapi uvicorn websockets python-dotenv pydantic
```

Create your `.env` file in the project root:
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
```

**NEVER commit `.env` to GitHub.**

---

## 🧬 Core Concepts (Read This First)

### The Evolution Loop

```
Generation 0:
  Generator Agent → creates 6 initial ideas from the seed problem
  Judge Agent     → scores each idea (0.0 to 1.0)

Generation 1+:
  Top 50% survive (selection)
  Bottom 50% die (their nodes fade out on the graph)
  Mutator Agent   → takes 1 surviving idea → produces 1 mutated child
  Crossbreeder Agent → takes 2 surviving ideas → produces 1 hybrid child
  Judge Agent     → scores new children
  Graph updates   → edges drawn from parent → child

Repeat for N generations (default: 5)
```

### The Data Model (Single Idea / Node)

```python
class Idea:
    id: str            # uuid
    text: str          # The idea content
    score: float       # 0.0 to 1.0 (Judge's fitness score)
    generation: int    # Which generation it was born in
    parents: list[str] # IDs of parent ideas (empty for Gen 0)
    status: str        # "alive" | "dead" | "champion"
    agent_type: str    # "generator" | "mutator" | "crossbreeder"
```

### Graph Visualization Logic

- Each **Idea = a node** in the D3 force graph
- Node **size** = proportional to score
- Node **color**:
  - 🟢 Green = alive, high score
  - 🟡 Yellow = alive, medium score
  - 🔴 Red = dead
  - 🌟 Gold = current champion
- **Edges** = lineage (parent → child)
- Nodes **pulse** when just created
- Dead nodes **shrink and fade** with CSS transition

---

## 🏗️ Step-by-Step Build Guide

---

### STEP 1 — Backend: Data Models (`models.py`)

```python
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
```

---

### STEP 2 — Backend: Agent Logic (`agents.py`)

This is the most important file. Each function calls Claude with a specific role.

```python
# backend/agents.py
import anthropic
import json
import os
from models import Idea

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

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

    response = client.messages.create(
        model="claude-opus-4-5",
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

    response = client.messages.create(
        model="claude-opus-4-5",
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

    response = client.messages.create(
        model="claude-opus-4-5",
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

    response = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}]
    )

    return response.content[0].text.strip()
```

**Critical prompting rules encoded above:**
- Every agent prompt has a clear role, a clear input, and a clear output format
- Output format is explicit ("Return ONLY...") to prevent hallucination
- JSON parsing has a fallback for markdown fences
- Scores are clamped to prevent out-of-range values

---

### STEP 3 — Backend: Evolution Loop (`evolution.py`)

```python
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
        message=f"🌱 Seeding generation 0 with {population_size} ideas..."
    ))

    raw_ideas = await generator_agent(problem, count=population_size)

    for raw_text in raw_ideas:
        idea = Idea(text=raw_text, generation=0, agent_type="generator")

        await broadcast(EvolutionEvent(event_type="new_idea", idea=idea, generation=0,
                                       message=f"Generated: {raw_text[:60]}..."))

        score = await judge_agent(problem, raw_text)
        idea.score = score

        await broadcast(EvolutionEvent(event_type="idea_scored", idea=idea, generation=0,
                                       message=f"Scored {score:.2f}"))

        population.append(idea)
        all_ideas.append(idea)

    # ── GENERATION 1 to N ──
    for gen in range(1, generations + 1):
        await broadcast(EvolutionEvent(
            event_type="generation_complete",
            generation=gen,
            message=f"🧬 Generation {gen} starting..."
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
                                           message=f"💀 Idea died: score {idea.score:.2f}"))

        # Reproduction: fill population back up
        children: list[Idea] = []

        # Half children = mutations of survivors
        for _ in range(population_size // 2):
            parent = random.choice(survivors)
            mutated_text = await mutator_agent(problem, parent.text)
            child = Idea(
                text=mutated_text,
                generation=gen,
                parents=[parent.id],
                agent_type="mutator"
            )
            await broadcast(EvolutionEvent(event_type="new_idea", idea=child, generation=gen,
                                           message=f"🔬 Mutated from {parent.id}"))
            score = await judge_agent(problem, mutated_text)
            child.score = score
            await broadcast(EvolutionEvent(event_type="idea_scored", idea=child, generation=gen,
                                           message=f"Scored {score:.2f}"))
            children.append(child)
            all_ideas.append(child)

        # Half children = crossbreeds of two survivors
        for _ in range(population_size // 2):
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
                                           message=f"⚗️ Crossbred from {parent_a.id} + {parent_b.id}"))
            score = await judge_agent(problem, hybrid_text)
            child.score = score
            await broadcast(EvolutionEvent(event_type="idea_scored", idea=child, generation=gen,
                                           message=f"Scored {score:.2f}"))
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
```

---

### STEP 4 — Backend: FastAPI Server (`main.py`)

```python
# backend/main.py
import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from models import SeedRequest, EvolutionEvent
from evolution import run_evolution

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/evolve")
async def evolve_websocket(websocket: WebSocket):
    await websocket.accept()

    try:
        # Receive the seed config from client
        data = await websocket.receive_text()
        request = SeedRequest(**json.loads(data))

        async def broadcast(event: EvolutionEvent):
            await websocket.send_text(event.model_dump_json())

        await run_evolution(
            problem=request.problem,
            generations=request.generations,
            population_size=request.population_size,
            broadcast=broadcast
        )

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        await websocket.send_text(json.dumps({"event_type": "error", "message": str(e)}))

@app.get("/health")
def health():
    return {"status": "ok"}
```

**To run the backend:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

---

### STEP 5 — Frontend Setup

```bash
cd frontend
npm create vite@latest . -- --template react
npm install
npm install d3 tailwindcss @tailwindcss/vite
```

**`vite.config.js`:**
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

**`src/index.css`** — add at the top:
```css
@import "tailwindcss";
```

---

### STEP 6 — Frontend: WebSocket Hook (`useEvolution.js`)

```js
// src/hooks/useEvolution.js
import { useState, useRef, useCallback } from "react";

export function useEvolution() {
  const [nodes, setNodes] = useState([]);      // all ideas as graph nodes
  const [edges, setEdges] = useState([]);      // parent → child edges
  const [logs, setLogs] = useState([]);        // event log
  const [champion, setChampion] = useState(null);
  const [running, setRunning] = useState(false);
  const wsRef = useRef(null);

  const start = useCallback((problem, generations = 5, populationSize = 6) => {
    // Reset state
    setNodes([]);
    setEdges([]);
    setLogs([]);
    setChampion(null);
    setRunning(true);

    const ws = new WebSocket("ws://localhost:8000/ws/evolve");
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ problem, generations, population_size: populationSize }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      setLogs(prev => [...prev.slice(-50), `[Gen ${data.generation}] ${data.message}`]);

      if (data.idea) {
        const idea = data.idea;

        if (data.event_type === "new_idea" || data.event_type === "idea_scored") {
          setNodes(prev => {
            const existing = prev.find(n => n.id === idea.id);
            if (existing) {
              // Update score
              return prev.map(n => n.id === idea.id ? { ...n, score: idea.score } : n);
            }
            return [...prev, { ...idea, x: Math.random() * 600, y: Math.random() * 400 }];
          });

          // Add edges from parents
          if (idea.parents && idea.parents.length > 0) {
            const newEdges = idea.parents.map(parentId => ({
              source: parentId,
              target: idea.id,
              id: `${parentId}-${idea.id}`
            }));
            setEdges(prev => [...prev, ...newEdges]);
          }
        }

        if (data.event_type === "idea_died") {
          setNodes(prev => prev.map(n => n.id === idea.id ? { ...n, status: "dead" } : n));
        }

        if (data.event_type === "champion") {
          setNodes(prev => prev.map(n => n.id === idea.id ? { ...n, status: "champion" } : n));
          setChampion(idea);
          setRunning(false);
        }
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error", err);
      setRunning(false);
    };

    ws.onclose = () => setRunning(false);
  }, []);

  const stop = useCallback(() => {
    wsRef.current?.close();
    setRunning(false);
  }, []);

  return { nodes, edges, logs, champion, running, start, stop };
}
```

---

### STEP 7 — Frontend: D3 Graph (`GraphCanvas.jsx`)

This is the visual heart of the app. Read carefully.

```jsx
// src/components/GraphCanvas.jsx
import { useEffect, useRef } from "react";
import * as d3 from "d3";

// Color by status
const nodeColor = (idea) => {
  if (idea.status === "champion") return "#FFD700";
  if (idea.status === "dead") return "#ef4444";
  if (idea.score > 0.7) return "#22c55e";
  if (idea.score > 0.4) return "#eab308";
  return "#3b82f6";
};

const nodeRadius = (idea) => {
  const base = 8;
  return base + idea.score * 20;  // bigger = higher score
};

export default function GraphCanvas({ nodes, edges, onNodeClick }) {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous render
    svg.selectAll("*").remove();

    // Arrow marker for directed edges
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#6b7280");

    // Simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(edges).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => nodeRadius(d) + 5));

    simulationRef.current = simulation;

    // Edges
    const link = svg.append("g")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", "#4b5563")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrowhead)");

    // Nodes
    const node = svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => nodeRadius(d))
      .attr("fill", d => nodeColor(d))
      .attr("opacity", d => d.status === "dead" ? 0.3 : 1)
      .attr("stroke", d => d.status === "champion" ? "#FFD700" : "#1f2937")
      .attr("stroke-width", d => d.status === "champion" ? 3 : 1)
      .style("cursor", "pointer")
      .on("click", (_, d) => onNodeClick && onNodeClick(d))
      .call(
        d3.drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      );

    // Generation labels
    svg.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text(d => `G${d.generation}`)
      .attr("font-size", 9)
      .attr("fill", "#9ca3af")
      .attr("text-anchor", "middle")
      .attr("dy", d => -nodeRadius(d) - 3);

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
      svg.selectAll("text")
        .attr("x", d => d.x)
        .attr("y", d => d.y);
    });

    return () => simulation.stop();
  }, [nodes, edges]);  // Re-render when data changes

  return (
    <svg
      ref={svgRef}
      className="w-full h-full bg-gray-950 rounded-xl"
    />
  );
}
```

---

### STEP 8 — Frontend: App Shell (`App.jsx`)

```jsx
// src/App.jsx
import { useState } from "react";
import { useEvolution } from "./hooks/useEvolution";
import GraphCanvas from "./components/GraphCanvas";

export default function App() {
  const { nodes, edges, logs, champion, running, start, stop } = useEvolution();
  const [problem, setProblem] = useState("");
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [generations, setGenerations] = useState(5);

  const aliveCount = nodes.filter(n => n.status !== "dead").length;
  const deadCount = nodes.filter(n => n.status === "dead").length;

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white font-mono">

      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center gap-4">
        <span className="text-green-400 text-xl font-bold">🧬 Evolutionary Idea Market</span>
        <span className="text-gray-400 text-sm ml-auto">
          Nodes: {nodes.length} | Alive: {aliveCount} | Dead: {deadCount}
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Left Panel — Controls */}
        <div className="w-72 flex flex-col gap-4 p-4 border-r border-gray-800 overflow-y-auto">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-widest">Seed Problem</label>
            <textarea
              className="w-full mt-1 bg-gray-900 rounded p-2 text-sm text-white border border-gray-700 resize-none h-24"
              placeholder="e.g. How do we cure urban loneliness?"
              value={problem}
              onChange={e => setProblem(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-widest">Generations</label>
            <input
              type="number"
              min={2} max={10}
              value={generations}
              onChange={e => setGenerations(Number(e.target.value))}
              className="w-full mt-1 bg-gray-900 rounded p-2 text-sm text-white border border-gray-700"
            />
          </div>

          {!running ? (
            <button
              onClick={() => start(problem, generations)}
              disabled={!problem.trim()}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-40 rounded px-4 py-2 text-sm font-bold"
            >
              ▶ Start Evolution
            </button>
          ) : (
            <button
              onClick={stop}
              className="bg-red-700 hover:bg-red-600 rounded px-4 py-2 text-sm font-bold"
            >
              ■ Stop
            </button>
          )}

          {/* Champion card */}
          {champion && (
            <div className="bg-yellow-900/30 border border-yellow-500/50 rounded p-3 mt-2">
              <div className="text-yellow-400 text-xs font-bold mb-1">🏆 CHAMPION</div>
              <div className="text-xs text-gray-200">{champion.text}</div>
              <div className="text-yellow-300 text-xs mt-1">Score: {champion.score.toFixed(3)}</div>
            </div>
          )}

          {/* Selected idea panel */}
          {selectedIdea && (
            <div className="bg-gray-900 border border-gray-700 rounded p-3">
              <div className="text-xs text-blue-400 font-bold mb-1">Selected Node</div>
              <div className="text-xs text-gray-300">{selectedIdea.text}</div>
              <div className="mt-2 text-xs text-gray-500">
                <div>Gen: {selectedIdea.generation}</div>
                <div>Score: {selectedIdea.score.toFixed(3)}</div>
                <div>Type: {selectedIdea.agent_type}</div>
                <div>Status: {selectedIdea.status}</div>
                {selectedIdea.parents?.length > 0 && (
                  <div>Parents: {selectedIdea.parents.join(", ")}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Center — Graph */}
        <div className="flex-1 relative">
          {nodes.length === 0 && !running && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">
              Enter a problem and start evolution to see the idea ecosystem grow
            </div>
          )}
          <GraphCanvas nodes={nodes} edges={edges} onNodeClick={setSelectedIdea} />
        </div>

        {/* Right Panel — Event Log */}
        <div className="w-64 flex flex-col border-l border-gray-800">
          <div className="p-2 text-xs text-gray-500 uppercase tracking-widest border-b border-gray-800">
            Event Log
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="text-xs text-gray-400 leading-relaxed">{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### STEP 9 — Run Everything

**Terminal 1 — Backend:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Opens at http://localhost:5173
```

---

## 🐛 Common Bugs & Fixes

| Bug | Cause | Fix |
|---|---|---|
| `json.JSONDecodeError` on agent output | Claude wrapped response in ```json | Add the markdown fence stripper in `generator_agent` |
| Score comes back as `"0.73"` (string) | API returns text | Wrap in `float()` — already done in code |
| D3 graph doesn't update on new nodes | Nodes array mutated in place | Always use `setNodes(prev => [...prev, newNode])` — spread operator |
| CORS error in browser | Frontend origin not whitelisted | Check `allow_origins` in FastAPI CORS config matches your Vite port |
| WebSocket connects then immediately closes | Server exception before send | Wrap `run_evolution` in try/except, send error event |
| Graph re-renders from scratch each update | D3 `useEffect` deps wrong | Ensure `[nodes, edges]` in deps array |
| Nodes all pile in center | No initial positions | Set `x: Math.random() * 600` when creating node in hook |

---

## 🎨 LinkedIn Screenshot Strategy

For maximum impact, screenshot these moments:

1. **Mid-evolution chaos** — many nodes, some red/dead, some green/alive, edges everywhere
2. **Champion reveal** — the gold node glowing, champion card showing
3. **The log panel** — showing the agent types working (Generator, Mutator, Crossbreeder)

**Caption template:**
> "Built an Evolutionary Idea Market over the weekend. AI agents compete like biological species to solve problems. Weak ideas die. Strong ideas mutate and crossbreed. After 5 generations, one idea survives as champion.
>
> Tech: Claude Opus + FastAPI + D3.js. Full repo in comments."

---

## 🚀 Stretch Goals (Post-MVP)

If you have extra time:

- **Export champion ideas** to a markdown file
- **Multiple simultaneous ecosystems** — run 3 problems at once, compare champion quality
- **Persona layer** — assign agent names (Einstein mutates, Darwin crossbreeds, etc.)
- **Real-time score graph** — line chart showing average fitness per generation
- **Shareable link** — encode the problem in URL params so others can replay

---

## 📦 `requirements.txt`

```
anthropic>=0.25.0
fastapi>=0.111.0
uvicorn[standard]>=0.29.0
python-dotenv>=1.0.0
pydantic>=2.7.0
websockets>=12.0
```

---

## 🔑 Key Architectural Decisions (For Your LinkedIn Post)

1. **Why WebSocket over REST polling?** — Evolution is a streaming process. Each agent call produces an event. WebSocket lets the graph update live as ideas are born and die.

2. **Why separate agents instead of one big prompt?** — Each agent has a focused, single job. The Generator doesn't know about scoring; the Judge doesn't know about mutation. This mirrors how real genetic algorithms separate fitness evaluation from reproduction.

3. **Why D3 force-directed graph?** — The physics simulation naturally clusters related ideas (same lineage = connected = pulled together). You get emergent visual structure for free.

4. **Why Claude Opus?** — The quality of mutation and crossbreeding is the entire product. Using a weaker model produces generic mutations that all converge. Opus produces genuinely creative conceptual twists.

---

*Happy building. Ship it Sunday, post it Monday.*
