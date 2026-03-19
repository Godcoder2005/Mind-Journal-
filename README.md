# Mind Journal (Mind Mirror)

An AI-powered intelligent journaling platform designed to turn your daily thoughts into actionable insights. Mind Journal serves as more than just a digital diary—it acts as a personal knowledge base and reflection partner powered by advanced NLP and generative AI.

## 🌟 Key Features

- **Smart Journaling**: Logs entries while automatically analyzing underlying emotions, energy scores, valence, themes, and mentioned people.
- **Nightly Check-ins**: Structured end-of-day reflections focusing on defining moments, patience tests, and intentions for tomorrow.
- **Energy Forecasts & Tracking**: Monitors energy trends across days and uses AI to forecast upcoming energy peaks and troughs, offering personalized advice to maintain balance.
- **Alter Ego Persona**: Engage in a conversational format with an AI that knows your context, patterns, and past entries, acting as a personal guide or sounding board.
- **Future Self Letters**: Automatically generated letters at the end of each month written from the perspective of your "future self," summarizing your monthly mood, average energy, and behavioral patterns.
- **Personal Knowledge Graph**: Automatically extracts entities (people, goals, habits) from your entries and maps relationships to track how they affect your well-being.

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19 with Vite
- **Styling**: Vanilla CSS with comprehensive CSS custom properties for theming
- **Routing**: React Router (Protected and public routes)
- **Build Tool**: Vite

### Backend
- **Framework**: FastAPI
- **Database**: SQLite with SQLAlchemy ORM
- **AI & NLP**: LangChain, LangGraph, Google GenAI (Gemini)
- **Vector DB**: FAISS (for Retrieval-Augmented Generation)
- **Scheduling**: APScheduler (for cron jobs like building Future Letters)
- **Authentication**: JWT & basic hashing implementation

## 📁 Project Structure

```text
mind-journal/
│
├── backend/
│   ├── db/            # SQLAlchemy Database Models and connections
│   ├── prompts/       # System prompts for AI Persona and insights
│   ├── routes/        # FastAPI endpoints (auth, energy, insights, journal, agent)
│   ├── services/      # LangGraph flows, AI agents, RAG, schedule workers
│   ├── utils/         # Helper functions
│   ├── main.py        # FastAPI application entry point
│   ├── migrate.py     # Database schema migrations
│   └── requirements.txt
│
└── frontend/
    ├── public/        # Static assets
    ├── src/
    │   ├── api/       # Axios API client logic for backend communication
    │   ├── assets/    # UI assets and imagery
    │   ├── components/# Reusable UI components (Sidebar, Layout, ProtectedRoute)
    │   ├── pages/     # Feature Pages (Dashboard, Journal, NightlyCheckin, AlterEgo, etc.)
    │   ├── styles/    # Additional CSS styles
    │   ├── App.jsx    # Application Router and setup
    │   ├── main.jsx   # React DOM entry
    │   └── index.css  # Global styles and design system tokens
    ├── package.json
    └── vite.config.js
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Gemini API Key

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up the environment variables:
   - Create a `.env` file in the backend directory.
   - Add your Gemini API Key (`GEMINI_API_KEY=YOUR_KEY_HERE`) and any other necessary secrets.
5. Apply database schemas / migrations if necessary. The application will initialize `mind_mirror.db` on launch.
6. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

## 🧠 Architecture Highlights

- **LangGraph Integration**: The backend employs LangGraph state graphs in `services/agent_graph.py` and modular AI services (`services/rag.py`, `services/sentiment.py`, `services/patterns.py`) to systematically parse journal entries, extract entities, evaluate sentiment, and yield comprehensive psychological insights.
- **Asynchronous Task Management**: `APScheduler` works in the background handling time-sensitive operations like generating the Monthly Future Letters automatically at the turn of every month without interrupting the main FastAPI thread.
- **RAG via FAISS**: A Personal Knowledge Grain (PKG) is maintained by clustering distinct themes and tracking entities in a local FAISS index. This ensures the "Alter Ego" conversations remain contextually hyper-aware of the user's specific history and relationships.
