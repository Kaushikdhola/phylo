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

    // Container group for zoom/pan
    const g = svg.append("g");

    // Zoom & pan behavior
    const zoom = d3.zoom()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Double-click to reset zoom
    svg.on("dblclick.zoom", () => {
      svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
    });

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
      .force("collision", d3.forceCollide().radius(d => nodeRadius(d) + 5))
      .force("bounds", () => {
        const padding = 40;
        for (const d of nodes) {
          d.x = Math.max(padding, Math.min(width - padding, d.x));
          d.y = Math.max(padding, Math.min(height - padding, d.y));
        }
      });

    simulationRef.current = simulation;

    // Edges
    const link = g.append("g")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", "#4b5563")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrowhead)");

    // Nodes
    const node = g.append("g")
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
    const labels = g.append("g")
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
      labels
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
