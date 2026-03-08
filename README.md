<p align="center">
  <span style="font-size: 48px">🧬</span>
</p>

<h1 align="center">phylo</h1>
<p align="center"><b>Evolutionary Idea Market — AI agents evolve solutions through Darwinian selection</b></p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.10+-blue?logo=python&logoColor=white" alt="Python 3.10+">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/FastAPI-0.111+-009688?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Claude_API-Anthropic-D97706?logo=anthropic&logoColor=white" alt="Claude API">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License">
</p>

---

**phylo** is a research playground that applies evolutionary computation to AI-driven ideation. Multiple specialized AI agents — generators, judges, mutators, and crossbreeders — compete in a Darwinian market where ideas are born, scored, selected, recombined, and eliminated across generations.

Watch fitness landscapes emerge, observe selection pressure in real time, and explore the phylogenetic lineage of the champion idea.

## Features

- **Multi-Agent Evolution** — Four specialized agents (Generator, Judge, Mutator, Crossbreeder) collaborate and compete through evolutionary cycles
- **Real-Time Visualization** — Interactive force-directed graph showing idea populations, lineages, and fitness with zoom/pan/drag
- **Phylogenetic Tree View** — D3 cladogram showing ancestor-descendant relationships, true to the project's name
- **Fitness Landscape Chart** — Tracks best, average, and worst fitness scores across generations
- **Live Analytics Dashboard** — Leaderboard, agent performance comparison, genetic operation counts, and champion lineage
- **Export & Reproducibility** — Download full experiment data as JSON or a formatted Markdown report
- **Session Persistence** — Evolution state survives page refreshes and tab switches

## Architecture

```
┌────────────────────────────────────────────────────┐
│                    Frontend (React)                 │
│  ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │ Force    │ │ Phylo    │ │ Analytics          │  │
│  │ Graph    │ │ Tree     │ │ (Chart/Board/Stats)│  │
│  └──────────┘ └──────────┘ └────────────────────┘  │
│              WebSocket (real-time events)           │
└────────────────────┬───────────────────────────────┘
                     │
┌────────────────────┴───────────────────────────────┐
│                  Backend (FastAPI)                   │
│  ┌─────────────────────────────────────────────┐    │
│  │              Evolution Loop                  │    │
│  │  ┌──────────┐ ┌───────┐ ┌────────┐         │    │
│  │  │Generator │ │ Judge │ │Mutator │         │    │
│  │  │  Agent   │ │ Agent │ │ Agent  │         │    │
│  │  └──────────┘ └───────┘ └────────┘         │    │
│  │  ┌─────────────┐                           │    │
│  │  │ Crossbreeder│                           │    │
│  │  │   Agent     │                           │    │
│  │  └─────────────┘                           │    │
│  └─────────────────────────────────────────────┘    │
│                      │                              │
│               Claude API (Anthropic)                │
└────────────────────────────────────────────────────┘
```

## Quickstart

### Prerequisites

- Python 3.10+
- Node.js 20+
- [Anthropic API key](https://console.anthropic.com/)

### 1. Clone & configure

```bash
git clone https://github.com/<your-username>/phylo.git
cd phylo
```

Create a `.env` file in the project root:

```
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — enter a seed problem, set generations, and click **Start Evolution**.

## How It Works

| Phase | Agent | Description |
|-------|-------|-------------|
| **Seed** | Generator | Creates initial population of competing hypotheses |
| **Score** | Judge | Evaluates each idea on novelty, feasibility, and impact (0–1) |
| **Select** | — | Top 50% survive; bottom 50% are eliminated |
| **Mutate** | Mutator | Rewrites surviving ideas to explore nearby solution space |
| **Crossbreed** | Crossbreeder | Combines two parent ideas into a novel hybrid |
| **Repeat** | — | Loop for N generations; crown the highest-scoring idea |

## Research Context

phylo sits at the intersection of several active research areas:

- **Evolutionary Computation** — Genetic algorithms, selection pressure, fitness landscapes ([Holland 1975](https://mitpress.mit.edu/9780262581110/), [Eiben & Smith 2015](https://link.springer.com/book/10.1007/978-3-662-44874-8))
- **LLM-as-Optimizer** — Using language models as mutation/crossover operators ([Yang et al. 2023](https://arxiv.org/abs/2309.03409))
- **Multi-Agent Systems** — Specialized agents with distinct roles cooperating on a shared task ([Wooldridge 2009](https://www.wiley.com/en-us/An+Introduction+to+MultiAgent+Systems-p-9780470519462))
- **Collective Intelligence** — Emergent quality from competitive-cooperative dynamics ([Malone & Bernstein 2015](https://mitpress.mit.edu/9780262029810/))
- **Idea Markets** — Market-based mechanisms for scoring and selecting ideas ([Hanson 2003](https://mason.gmu.edu/~rhanson/ideafutures.html))

### Key Questions You Can Explore

- Does crossover outperform mutation for open-ended problems?
- How does population size affect convergence speed?
- At what generation count does quality plateau?
- Which agent type produces the highest-scoring ideas?
- How does selection pressure (top-k%) affect diversity vs. quality?

## Project Structure

```
phylo/
├── backend/
│   ├── agents.py          # AI agent functions (generator, judge, mutator, crossbreeder)
│   ├── evolution.py        # Main evolution loop with selection/reproduction
│   ├── main.py             # FastAPI server + WebSocket endpoint
│   ├── models.py           # Pydantic data models (Idea, SeedRequest, EvolutionEvent)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GraphCanvas.jsx      # D3 force-directed network graph
│   │   │   ├── PhyloTree.jsx        # D3 phylogenetic tree (cladogram)
│   │   │   ├── FitnessChart.jsx     # Recharts fitness landscape chart
│   │   │   ├── Leaderboard.jsx      # Ranked idea leaderboard
│   │   │   └── EvolutionSummary.jsx # Post-run analytics dashboard
│   │   ├── hooks/
│   │   │   └── useEvolution.js      # WebSocket state management + session persistence
│   │   ├── utils/
│   │   │   └── exportReport.js      # JSON + Markdown export utilities
│   │   └── App.jsx                  # Main application shell
│   └── package.json
├── .env                    # API key (not committed)
└── README.md
```

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| Generations | 5 | Number of evolutionary cycles |
| Population Size | 6 | Ideas per generation |
| Model | `claude-haiku-4-5-20251001` | Anthropic model for agents |
| Selection | Top 50% | Survival threshold |

To change the model, edit `MODEL` in `backend/agents.py`. For higher quality results, use `claude-sonnet-4-20250514` or `claude-opus-4-0-20250115`.

## Export Formats

### Markdown Report
Includes: seed problem, summary statistics table, champion details, agent performance comparison, top 5 ideas, and the full evolution log.

### JSON Data
Complete experiment data for analysis: all ideas with scores, edges (parent-child relationships), logs, and metadata. Suitable for loading into notebooks or downstream analysis tools.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 6, Tailwind CSS v4 |
| Visualization | D3.js (force graph + tree), Recharts |
| Backend | FastAPI, Uvicorn, Pydantic v2 |
| AI | Anthropic Claude API (async) |
| Communication | WebSocket (real-time streaming) |
| State | sessionStorage (client-side persistence) |

## License

MIT

---

<p align="center">
  <i>Built with evolutionary principles and artificial intelligence.</i><br>
  <b>phylo</b> — let ideas compete, mutate, and evolve.
</p>
