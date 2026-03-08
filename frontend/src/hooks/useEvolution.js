// src/hooks/useEvolution.js
import { useState, useRef, useCallback, useEffect } from "react";

const STORAGE_KEY = "phylo_state";

function loadSaved() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveState(state) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function useEvolution() {
  const saved = useRef(loadSaved());
  const [nodes, setNodes] = useState(saved.current?.nodes || []);
  const [edges, setEdges] = useState(saved.current?.edges || []);
  const [logs, setLogs] = useState(saved.current?.logs || []);
  const [champion, setChampion] = useState(saved.current?.champion || null);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState(saved.current?.status || "");
  const [generation, setGeneration] = useState(saved.current?.generation || 0);
  const wsRef = useRef(null);

  // Persist state to sessionStorage on every change
  useEffect(() => {
    saveState({ nodes, edges, logs, champion, status, generation });
  }, [nodes, edges, logs, champion, status, generation]);

  const start = useCallback((problem, generations = 5, populationSize = 6) => {
    // Reset state and storage
    sessionStorage.removeItem(STORAGE_KEY);
    setNodes([]);
    setEdges([]);
    setLogs([]);
    setChampion(null);
    setRunning(true);
    setStatus("Connecting to evolution server...");
    setGeneration(0);

    const ws = new WebSocket("ws://localhost:8000/ws/evolve");
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("Connected. Sending seed problem to AI agents...");
      setLogs(prev => [...prev, "🔗 Connected to server"]);
      ws.send(JSON.stringify({ problem, generations, population_size: populationSize }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Update generation tracker
      if (data.generation !== undefined) {
        setGeneration(data.generation);
      }

      // Set descriptive status based on event type
      if (data.event_type === "generation_complete") {
        setStatus(data.message);
      } else if (data.event_type === "new_idea") {
        const agentLabel = data.idea?.agent_type === "generator" ? "Generator Agent"
          : data.idea?.agent_type === "mutator" ? "Mutator Agent"
          : "Crossbreeder Agent";
        setStatus(`${agentLabel} created a new idea → sending to Judge...`);
      } else if (data.event_type === "idea_scored") {
        setStatus(`Judge scored idea: ${data.idea?.score?.toFixed(2)} — ${data.idea?.text?.slice(0, 50)}...`);
      } else if (data.event_type === "idea_died") {
        setStatus(`💀 Weak idea eliminated (score: ${data.idea?.score?.toFixed(2)})`);
      } else if (data.event_type === "champion") {
        setStatus(`🏆 Evolution complete! Champion found with score ${data.idea?.score?.toFixed(3)}`);
      } else if (data.event_type === "error") {
        setStatus(`❌ Error: ${data.message}`);
      }

      // Add to log with timestamp-like prefix
      const logPrefix = data.generation !== undefined ? `Gen ${data.generation}` : "System";
      setLogs(prev => [...prev.slice(-100), `[${logPrefix}] ${data.message}`]);

      if (data.idea) {
        const idea = data.idea;

        if (data.event_type === "new_idea" || data.event_type === "idea_scored") {
          setNodes(prev => {
            const existing = prev.find(n => n.id === idea.id);
            if (existing) {
              return prev.map(n => n.id === idea.id ? { ...n, score: idea.score } : n);
            }
            return [...prev, { ...idea, x: Math.random() * 600, y: Math.random() * 400 }];
          });

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
      setStatus("❌ Connection error — is the backend running on port 8000?");
      setLogs(prev => [...prev, "❌ WebSocket connection failed"]);
      setRunning(false);
    };

    ws.onclose = () => {
      if (!champion) {
        setStatus(prev => prev.startsWith("🏆") ? prev : "Connection closed");
      }
      setRunning(false);
    };
  }, []);

  const stop = useCallback(() => {
    wsRef.current?.close();
    setStatus("Evolution stopped by user");
    setRunning(false);
  }, []);

  return { nodes, edges, logs, champion, running, status, generation, start, stop };
}
