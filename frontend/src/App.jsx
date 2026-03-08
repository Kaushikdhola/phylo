// src/App.jsx
import { useState } from "react";
import { useEvolution } from "./hooks/useEvolution";
import GraphCanvas from "./components/GraphCanvas";
import FitnessChart from "./components/FitnessChart";
import Leaderboard from "./components/Leaderboard";
import EvolutionSummary from "./components/EvolutionSummary";
import PhyloTree from "./components/PhyloTree";
import { exportJSON, exportMarkdown } from "./utils/exportReport";

const HOW_IT_WORKS = [
  { icon: "🌱", title: "Seed", desc: "You pose a problem. AI generates competing hypotheses." },
  { icon: "⚖️", title: "Judge", desc: "Each idea is scored on novelty, feasibility & impact." },
  { icon: "💀", title: "Select", desc: "Weak ideas die. The top 50% survive to reproduce." },
  { icon: "🧬", title: "Evolve", desc: "Survivors mutate and crossbreed to create new ideas." },
  { icon: "🏆", title: "Champion", desc: "After N generations, the fittest idea is crowned." },
];

const TABS = ["log", "leaderboard", "analytics"];

export default function App() {
  const { nodes, edges, logs, champion, running, status, generation, start, stop } = useEvolution();
  const [problem, setProblem] = useState("");
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [generations, setGenerations] = useState(5);
  const [rightTab, setRightTab] = useState("log");
  const [showChart, setShowChart] = useState(true);
  const [centerView, setCenterView] = useState("graph"); // "graph" | "tree"

  const aliveCount = nodes.filter(n => n.status !== "dead").length;
  const deadCount = nodes.filter(n => n.status === "dead").length;
  const hasStarted = nodes.length > 0 || running;

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white font-mono">

      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🧬</span>
          <span className="text-green-400 text-xl font-bold tracking-tight">phylo</span>
          <span className="text-gray-600 text-xs ml-1 hidden sm:inline">evolutionary idea engine</span>
        </div>
        {hasStarted && (
          <div className="flex items-center gap-3 text-xs ml-auto">
            {running && (
              <span className="text-green-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block"></span>
                Gen {generation}
              </span>
            )}
            <span className="text-gray-500 tabular-nums">
              Nodes: {nodes.length} &middot; Alive: {aliveCount} &middot; Dead: {deadCount}
            </span>
          </div>
        )}
      </div>

      {/* Welcome screen — shown before any evolution starts */}
      {!hasStarted ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto">
          <div className="max-w-2xl w-full text-center space-y-8">

            {/* Hero */}
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight">
                <span className="text-green-400">phylo</span>
              </h1>
              <p className="text-gray-400 text-sm uppercase tracking-widest">Evolutionary Idea Market</p>
              <p className="text-gray-400 text-base leading-relaxed max-w-lg mx-auto">
                A research playground for <span className="text-white">evolutionary computation applied to ideation</span>.
                Multiple AI agents compete through Darwinian selection, mutation, and crossover
                to evolve solutions to open-ended problems.
              </p>
              <p className="text-gray-500 text-xs max-w-md mx-auto leading-relaxed">
                Based on principles from genetic algorithms, multi-agent systems, and collective intelligence.
                Observe fitness landscapes, selection pressure, and emergent idea phylogenies in real time.
              </p>
            </div>

            {/* How it works */}
            <div className="grid grid-cols-5 gap-3 pt-2">
              {HOW_IT_WORKS.map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-1.5 p-3 rounded-lg bg-gray-900/50 border border-gray-800/60">
                  <span className="text-2xl">{step.icon}</span>
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{step.title}</span>
                  <span className="text-[11px] text-gray-500 leading-snug">{step.desc}</span>
                </div>
              ))}
            </div>

            {/* Seed input */}
            <div className="max-w-md mx-auto w-full space-y-3 pt-2">
              <textarea
                className="w-full bg-gray-900 rounded-lg p-3 text-sm text-white border border-gray-700 focus:border-green-500 focus:outline-none resize-none h-24 placeholder-gray-600 transition-colors"
                placeholder="Enter a seed problem... e.g. How do we fix urban loneliness?"
                value={problem}
                onChange={e => setProblem(e.target.value)}
              />
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Generations</label>
                  <input
                    type="number"
                    min={2} max={10}
                    value={generations}
                    onChange={e => setGenerations(Number(e.target.value))}
                    className="w-16 bg-gray-900 rounded px-2 py-1.5 text-sm text-white border border-gray-700 focus:border-green-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => start(problem, generations)}
                  disabled={!problem.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg px-4 py-2.5 text-sm font-bold transition-colors"
                >
                  ▶ Start Evolution
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-5 text-[11px] text-gray-600 pt-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span> High fitness</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block"></span> Medium</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> New</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-40 inline-block"></span> Dead</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 ring-2 ring-yellow-400/50 inline-block"></span> Champion</span>
            </div>
          </div>
        </div>
      ) : (
        /* Evolution view — the working dashboard */
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
                disabled={running}
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
                disabled={running}
              />
            </div>

            {!running ? (
              <button
                onClick={() => start(problem, generations)}
                disabled={!problem.trim()}
                className="bg-green-600 hover:bg-green-500 disabled:opacity-40 rounded px-4 py-2 text-sm font-bold transition-colors"
              >
                ▶ Restart Evolution
              </button>
            ) : (
              <button
                onClick={stop}
                className="bg-red-700 hover:bg-red-600 rounded px-4 py-2 text-sm font-bold transition-colors"
              >
                ■ Stop
              </button>
            )}

            {/* Export buttons */}
            {nodes.length > 0 && !running && (
              <div className="flex gap-2">
                <button
                  onClick={() => exportMarkdown(nodes, edges, logs, champion, problem)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 rounded px-3 py-1.5 text-[10px] text-gray-300 transition-colors"
                >📄 Export Report</button>
                <button
                  onClick={() => exportJSON(nodes, edges, logs, champion, problem)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 rounded px-3 py-1.5 text-[10px] text-gray-300 transition-colors"
                >{ } Export JSON</button>
              </div>
            )}

            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-gray-500 border-t border-gray-800 pt-3">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> High fitness</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span> Medium</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> New</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 opacity-40 inline-block"></span> Dead</span>
              <span className="flex items-center gap-1.5 col-span-2"><span className="w-2 h-2 rounded-full bg-yellow-400 ring-2 ring-yellow-400/50 inline-block"></span> Champion</span>
            </div>

            {/* Champion card */}
            {champion && (
              <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3 mt-1 animate-pulse">
                <div className="text-yellow-400 text-xs font-bold mb-1">🏆 CHAMPION</div>
                <div className="text-xs text-gray-200 leading-relaxed">{champion.text}</div>
                <div className="text-yellow-300 text-xs mt-2 font-bold">Score: {champion.score.toFixed(3)}</div>
              </div>
            )}

            {/* Selected idea panel */}
            {selectedIdea && (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                <div className="text-xs text-blue-400 font-bold mb-1">Selected Node</div>
                <div className="text-xs text-gray-300 leading-relaxed">{selectedIdea.text}</div>
                <div className="mt-2 text-xs text-gray-500 space-y-0.5">
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

          {/* Center — Graph / Tree + Fitness Chart */}
          <div className="flex-1 relative flex flex-col">
            {/* Live status bar + view toggle */}
            <div className="px-3 py-2 border-b border-gray-800 bg-gray-900/50 flex items-center gap-2 shrink-0">
              {running && (
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0"></span>
              )}
              {status && <span className="text-xs text-gray-300 truncate flex-1">{status}</span>}
              {!status && <span className="flex-1"></span>}
              {nodes.length > 0 && (
                <div className="flex items-center gap-1 ml-auto shrink-0">
                  <button
                    onClick={() => setCenterView("graph")}
                    className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                      centerView === "graph" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
                    }`}
                  >Force Graph</button>
                  <button
                    onClick={() => setCenterView("tree")}
                    className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                      centerView === "tree" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
                    }`}
                  >Phylo Tree</button>
                </div>
              )}
            </div>
            <div className={showChart && nodes.length > 0 ? "flex-1 relative min-h-0" : "flex-1 relative"} style={showChart && nodes.length > 0 ? { flex: "3 1 0%" } : undefined}>
              {centerView === "graph" ? (
                <GraphCanvas nodes={nodes} edges={edges} onNodeClick={setSelectedIdea} />
              ) : (
                <PhyloTree nodes={nodes} edges={edges} onNodeClick={setSelectedIdea} />
              )}
            </div>
            {/* Collapsible Fitness Chart */}
            {nodes.length > 0 && (
              <div className="border-t border-gray-800">
                <button
                  onClick={() => setShowChart(c => !c)}
                  className="w-full px-3 py-1 text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
                >
                  <span>{showChart ? "▼" : "▶"}</span> Fitness Landscape
                </button>
                {showChart && (
                  <div className="h-36 px-2 pb-2">
                    <FitnessChart nodes={nodes} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel — Tabbed Analytics */}
          <div className="w-80 flex flex-col border-l border-gray-800">
            {/* Tabs */}
            <div className="flex border-b border-gray-800 shrink-0">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setRightTab(tab)}
                  className={`flex-1 px-2 py-2 text-[10px] uppercase tracking-wider font-semibold transition-colors ${
                    rightTab === tab ? "text-green-400 border-b-2 border-green-400" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {tab === "log" ? `Log (${logs.length})` : tab === "leaderboard" ? "Ranking" : "Analytics"}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {rightTab === "log" && (
                <div className="space-y-1" ref={el => { if (el) el.scrollTop = el.scrollHeight; }}>
                  {logs.map((log, i) => (
                    <div
                      key={i}
                      className={`text-xs leading-relaxed ${
                        log.includes('🏆') ? 'text-yellow-400 font-bold' :
                        log.includes('💀') ? 'text-red-400/70' :
                        log.includes('🔬') ? 'text-purple-400' :
                        log.includes('⚗️') ? 'text-cyan-400' :
                        log.includes('🌱') || log.includes('🧬') ? 'text-green-400' :
                        log.includes('Scored') ? 'text-gray-500' :
                        log.includes('Generated') ? 'text-blue-400' :
                        log.includes('❌') ? 'text-red-400' :
                        log.includes('🔗') ? 'text-green-500' :
                        'text-gray-400'
                      }`}
                    >{log}</div>
                  ))}
                </div>
              )}

              {rightTab === "leaderboard" && (
                <div>
                  <p className="text-[10px] text-gray-500 mb-3">Top surviving ideas ranked by fitness score</p>
                  <Leaderboard nodes={nodes} />
                </div>
              )}

              {rightTab === "analytics" && (
                <EvolutionSummary nodes={nodes} edges={edges} champion={champion} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
