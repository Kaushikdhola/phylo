// src/components/EvolutionSummary.jsx
import { useMemo } from "react";

export default function EvolutionSummary({ nodes, edges, champion }) {
  const stats = useMemo(() => {
    if (nodes.length === 0) return null;

    const alive = nodes.filter((n) => n.status !== "dead");
    const dead = nodes.filter((n) => n.status === "dead");
    const scores = alive.map((n) => n.score);
    const allScores = nodes.map((n) => n.score);
    const generations = [...new Set(nodes.map((n) => n.generation))];

    // Score by agent type
    const byAgent = {};
    for (const n of nodes) {
      if (!byAgent[n.agent_type]) byAgent[n.agent_type] = [];
      byAgent[n.agent_type].push(n.score);
    }
    const agentStats = Object.entries(byAgent).map(([type, scores]) => ({
      type,
      avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(3),
      count: scores.length,
      best: Math.max(...scores).toFixed(3),
    }));

    // Per-generation averages for improvement calc
    const genAvgs = {};
    for (const n of nodes) {
      if (!genAvgs[n.generation]) genAvgs[n.generation] = [];
      genAvgs[n.generation].push(n.score);
    }
    const genAvgList = Object.entries(genAvgs)
      .sort(([a], [b]) => a - b)
      .map(([, s]) => s.reduce((a, b) => a + b, 0) / s.length);

    const improvement = genAvgList.length >= 2
      ? ((genAvgList[genAvgList.length - 1] - genAvgList[0]) / genAvgList[0] * 100).toFixed(1)
      : "0";

    // Champion lineage
    let lineage = [];
    if (champion) {
      let current = champion.id;
      const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
      lineage.push(nodeMap[current]);
      const parentEdges = edges.filter((e) => e.target === current || e.target?.id === current);
      for (const e of parentEdges) {
        const parentId = typeof e.source === "object" ? e.source.id : e.source;
        if (nodeMap[parentId]) lineage.push(nodeMap[parentId]);
      }
    }

    return {
      total: nodes.length,
      alive: alive.length,
      dead: dead.length,
      survivalRate: ((alive.length / nodes.length) * 100).toFixed(1),
      avgScore: (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(3),
      bestScore: Math.max(...allScores).toFixed(3),
      generations: generations.length,
      improvement,
      agentStats,
      lineage,
      crossoverCount: edges.filter((e) => {
        const tgt = typeof e.target === "object" ? e.target.id : e.target;
        const node = nodes.find((n) => n.id === tgt);
        return node?.agent_type === "crossbreeder";
      }).length,
      mutationCount: nodes.filter((n) => n.agent_type === "mutator").length,
    };
  }, [nodes, edges, champion]);

  if (!stats) return null;

  const metricCard = (label, value, sub) => (
    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</div>
      {sub && <div className="text-[10px] text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-3 gap-2">
        {metricCard("Total Ideas", stats.total)}
        {metricCard("Survived", stats.alive, `${stats.survivalRate}% rate`)}
        {metricCard("Eliminated", stats.dead)}
        {metricCard("Generations", stats.generations)}
        {metricCard("Fitness Gain", `${stats.improvement}%`, "avg improvement")}
        {metricCard("Best Score", stats.bestScore)}
      </div>

      {/* Agent Performance */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Agent Performance</h4>
        <div className="space-y-1.5">
          {stats.agentStats.map((a) => (
            <div key={a.type} className="flex items-center justify-between bg-gray-800/30 rounded px-3 py-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs capitalize text-gray-300">{a.type}</span>
                <span className="text-[10px] text-gray-500">({a.count} ideas)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-400">avg {a.avg}</span>
                <span className="text-xs font-mono text-green-400">best {a.best}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Genetic Operations */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Genetic Operations</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-purple-900/20 border border-purple-800/30 rounded-lg p-2 text-center">
            <div className="text-sm font-bold text-purple-400">{stats.mutationCount}</div>
            <div className="text-[10px] text-purple-300/60">Mutations</div>
          </div>
          <div className="bg-amber-900/20 border border-amber-800/30 rounded-lg p-2 text-center">
            <div className="text-sm font-bold text-amber-400">{stats.crossoverCount}</div>
            <div className="text-[10px] text-amber-300/60">Crossovers</div>
          </div>
        </div>
      </div>

      {/* Champion Lineage */}
      {champion && stats.lineage.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Champion Lineage</h4>
          <div className="space-y-1">
            {stats.lineage.map((n, i) => (
              <div key={n.id} className="flex items-start gap-2 text-xs">
                <span className="text-gray-600 mt-0.5">{i === 0 ? "★" : "↳"}</span>
                <div className="min-w-0">
                  <p className="text-gray-300 truncate">{n.text}</p>
                  <span className="text-[10px] text-gray-500">G{n.generation} · {n.agent_type} · {n.score.toFixed(3)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
