import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR / 'prism.db'}")

# Simulation settings
SIMULATION_SPEED_MS = int(os.getenv("SIMULATION_SPEED_MS", "2000"))
SIMULATION_TICK_INTERVAL = float(os.getenv("SIMULATION_TICK_INTERVAL", "1.0"))

# Gemini (optional, not required for MVP)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

# OpenAI-compatible AI provider (optional)
AI_PROVIDER = os.getenv("AI_PROVIDER", "").strip().lower() or ("openai" if os.getenv("OPENAI_API_KEY") else "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
