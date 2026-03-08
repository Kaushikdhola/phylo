// src/components/PhyloTree.jsx
import { useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";

const nodeColor = (idea) => {
  if (idea.status === "champion") return "#FFD700";
  if (idea.status === "dead") return "#ef4444";
  if (idea.score > 0.7) return "#22c55e";
  if (idea.score > 0.4) return "#eab308";
  return "#3b82f6";
};

function buildTree(nodes, edges) {
  if (nodes.length === 0) return null;

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, { ...n, children: [] }]));
  const childSet = new Set();

  for (const e of edges) {
    const srcId = typeof e.source === "object" ? e.source.id : e.source;
    const tgtId = typeof e.target === "object" ? e.target.id : e.target;
    if (nodeMap[srcId] && nodeMap[tgtId]) {
      nodeMap[srcId].children.push(nodeMap[tgtId]);
      childSet.add(tgtId);
    }
  }

  // Find roots (nodes that are never a target)
  const roots = nodes.filter((n) => !childSet.has(n.id)).map((n) => nodeMap[n.id]);

  if (roots.length === 0) return null;

  // Create a virtual root if multiple roots
  const root =
    roots.length === 1
      ? roots[0]
      : { id: "__root__", text: "Origin", score: 0, generation: -1, agent_type: "root", status: "root", children: roots };

  return d3.hierarchy(root);
}

export default function PhyloTree({ nodes, edges, onNodeClick }) {
  const svgRef = useRef(null);

  const hierarchy = useMemo(() => buildTree(nodes, edges), [nodes, edges]);

  useEffect(() => {
    if (!svgRef.current || !hierarchy) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Zoom
    const zoom = d3.zoom()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);
    svg.on("dblclick.zoom", () =>
      svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity)
    );

    const margin = { top: 30, right: 40, bottom: 30, left: 40 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const treeLayout = d3.tree().size([innerH, innerW]);
    const treeData = treeLayout(hierarchy);

    g.attr("transform", `translate(${margin.left},${margin.top})`);

    // Links — curved paths
    g.selectAll(".tree-link")
      .data(treeData.links())
      .join("path")
      .attr("class", "tree-link")
      .attr("fill", "none")
      .attr("stroke", "#374151")
      .attr("stroke-width", 1.5)
      .attr("d", d3.linkHorizontal().x((d) => d.y).y((d) => d.x));

    // Node groups
    const nodeGroup = g
      .selectAll(".tree-node")
      .data(treeData.descendants())
      .join("g")
      .attr("class", "tree-node")
      .attr("transform", (d) => `translate(${d.y},${d.x})`)
      .style("cursor", "pointer")
      .on("click", (_, d) => {
        if (d.data.id !== "__root__" && onNodeClick) onNodeClick(d.data);
      });

    // Circles
    nodeGroup
      .append("circle")
      .attr("r", (d) => (d.data.id === "__root__" ? 4 : 6 + (d.data.score || 0) * 12))
      .attr("fill", (d) => (d.data.id === "__root__" ? "#6b7280" : nodeColor(d.data)))
      .attr("opacity", (d) => (d.data.status === "dead" ? 0.3 : 1))
      .attr("stroke", (d) => (d.data.status === "champion" ? "#FFD700" : "#1f2937"))
      .attr("stroke-width", (d) => (d.data.status === "champion" ? 3 : 1));

    // Generation label
    nodeGroup
      .filter((d) => d.data.id !== "__root__")
      .append("text")
      .text((d) => `G${d.data.generation}`)
      .attr("font-size", 8)
      .attr("fill", "#9ca3af")
      .attr("dy", -10)
      .attr("text-anchor", "middle");

    // Score label below
    nodeGroup
      .filter((d) => d.data.id !== "__root__")
      .append("text")
      .text((d) => d.data.score?.toFixed(2))
      .attr("font-size", 7)
      .attr("fill", "#6b7280")
      .attr("dy", 16)
      .attr("text-anchor", "middle");

    // Tooltips
    nodeGroup.append("title").text((d) => {
      if (d.data.id === "__root__") return "Origin";
      return `${d.data.text?.slice(0, 80)}...\nScore: ${d.data.score?.toFixed(3)}\nGen: ${d.data.generation}\nType: ${d.data.agent_type}`;
    });

    // Initial fit
    const bounds = g.node().getBBox();
    if (bounds.width > 0 && bounds.height > 0) {
      const scale = Math.min(
        (width - 20) / (bounds.width + 60),
        (height - 20) / (bounds.height + 60),
        1.5
      );
      const tx = (width - bounds.width * scale) / 2 - bounds.x * scale;
      const ty = (height - bounds.height * scale) / 2 - bounds.y * scale;
      svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    }
  }, [hierarchy, onNodeClick]);

  if (!hierarchy) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
        Tree will appear after evolution generates parent-child relationships
      </div>
    );
  }

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ background: "transparent" }}
    />
  );
}
