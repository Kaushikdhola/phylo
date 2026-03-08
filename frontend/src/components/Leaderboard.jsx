// src/components/Leaderboard.jsx
export default function Leaderboard({ nodes }) {
  const alive = nodes
    .filter((n) => n.status !== "dead")
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  if (alive.length === 0) return null;

  const agentColors = {
    generator: "#3b82f6",
    mutator: "#a855f7",
    crossbreeder: "#f59e0b",
  };

  return (
    <div className="space-y-1">
      {alive.map((n, i) => (
        <div
          key={n.id}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
          style={{ backgroundColor: i === 0 ? "rgba(234,179,8,0.1)" : "rgba(31,41,55,0.5)" }}
        >
          <span className="text-xs font-bold w-5 text-right" style={{ color: i === 0 ? "#eab308" : "#6b7280" }}>
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-300 truncate leading-tight">{n.text}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: `${agentColors[n.agent_type] || "#6b7280"}22`, color: agentColors[n.agent_type] || "#6b7280" }}
              >
                {n.agent_type}
              </span>
              <span className="text-[10px] text-gray-500">G{n.generation}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-mono font-bold" style={{ color: n.score > 0.7 ? "#22c55e" : n.score > 0.4 ? "#eab308" : "#ef4444" }}>
              {n.score.toFixed(2)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
