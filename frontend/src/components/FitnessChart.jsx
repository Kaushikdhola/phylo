// src/components/FitnessChart.jsx
import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

export default function FitnessChart({ nodes }) {
  const chartData = useMemo(() => {
    const genMap = {};
    for (const n of nodes) {
      if (!genMap[n.generation]) genMap[n.generation] = [];
      genMap[n.generation].push(n.score);
    }
    return Object.entries(genMap)
      .map(([gen, scores]) => ({
        gen: `G${gen}`,
        best: Math.max(...scores),
        avg: +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(3),
        worst: Math.min(...scores),
        count: scores.length,
      }))
      .sort((a, b) => parseInt(a.gen.slice(1)) - parseInt(b.gen.slice(1)));
  }, [nodes]);

  if (chartData.length < 1) return null;

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="bestGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="gen" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: "#9ca3af" }}
            itemStyle={{ color: "#e5e7eb" }}
            formatter={(value) => value.toFixed(3)}
          />
          <Area type="monotone" dataKey="best" stroke="#22c55e" fill="url(#bestGrad)" strokeWidth={2} name="Best" dot={{ r: 3, fill: "#22c55e" }} />
          <Area type="monotone" dataKey="avg" stroke="#3b82f6" fill="url(#avgGrad)" strokeWidth={1.5} name="Average" dot={{ r: 2, fill: "#3b82f6" }} />
          <Line type="monotone" dataKey="worst" stroke="#ef4444" strokeWidth={1} strokeDasharray="4 4" name="Worst" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
