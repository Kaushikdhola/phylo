# backend/main.py
import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from models import SeedRequest, EvolutionEvent
from evolution import run_evolution

load_dotenv(dotenv_path="../.env")

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
