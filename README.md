# ArkFlow Connect — AI-Powered Animal Health & Transfer Platform

[![Hackathon](https://img.shields.io/badge/Hackathon-MyHack%202026-blue)](https://myhack.gdg.dev)
[![Team](https://img.shields.io/badge/Team-saltAndPepperChips-orange)](#)
[![Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20React%20%7C%20Gemini-green)](#)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](#)

> GDGKL myHack2026 Finalist Submission 🏅

> **Programmable relationships for the animal health economy** — connecting zoos, vets, and regulators through AI-native workflows, live SLA monitoring, and a real-time zoonotic alert system.

## 👥 Team

**saltAndPepperChips** — GDG MyHack 2026

| Name | Role | Responsibilities |
|------|------|-----------------|
| **Krishna** | Backend Developer | FastAPI agents, database schemas, deployment, video pitch |
| **Francis** | Frontend Developer & Business Lead | React UI, UX design, business strategy, market research |

---

## 🌟 Vision

Every animal transfer today is managed through emails, spreadsheets, and phone calls. ArkFlow Connect turns those ad-hoc workflows into reusable, auditable, AI-monitored **transfer blueprints** — with embedded SLAs, a knowledge graph, and specialist AI agents that handle documents, matching, and outbreak detection automatically.

### The Problem
- Zoo-to-zoo transfers involve 6–14 regulatory documents per animal, processed manually.
- SLA breaches go undetected until they've already caused delays or permit expiries.
- Zoonotic outbreak intelligence is scattered across government RSS feeds with no automated triage.

### The Solution
| Capability | How ArkFlow Solves It |
|---|---|
| **Transfer Blueprints** | Reusable workflows with embedded SLAs and AI-generated compliance steps |
| **Health Passport** | Unified animal health records extracted from vet PDFs via Google Document AI |
| **SLA Monitor** | Real-time delay prediction + automated multi-channel escalation |
| **Zoonotic Heatmap** | Google Maps heatmap overlaid with tracked animal locations and outbreak severity |
| **Population Analytics** | Google BigQuery + Looker Studio for genetic diversity and inbreeding risk |
| **Knowledge Graph** | Neo4j-powered relationship engine mapping transfers, lineage, and risk |

---

## 🌍 Impact (UN SDGs)

- **SDG 15.5 — Life on Land**: Efficient, transparent transfers support global conservation breeding programs.
- **SDG 3.3 — Good Health & Well-being**: Real-time zoonotic outbreak alerts prevent cross-institution disease spread.
- **SDG 17.16 — Partnerships for Goals**: A shared platform for zoos, vets, and regulatory bodies across borders.

---

## 🤖 Agentic Ecosystem

ArkFlow operates as a **modular agent registry** — each agent handles a specific intent and can be swapped without touching the rest of the system.

### 📄 Document & Permit Agent
Extracts structured data from CITES permits, vet health certificates, and transfer emails using **Google Cloud Document AI** (Custom Document Extractor fine-tuned on permit schemas).

### 🤝 Matching Agent
Finds the optimal zoo-to-zoo match for a transfer using Neo4j graph queries, text embeddings, and Gemini re-ranking. Considers species, health status, distance, and historical transfer success rates.

### 📈 SLA Prediction Agent
Predicts delay probability before a transfer starts using rule-based heuristics with an XGBoost fallback. Triggers Celery-based escalations via Gmail and Twilio when thresholds are breached.

### 🔔 Alert Agent
Multi-channel outbreak notifications — **Gmail API** for institutional email, **Twilio** for emergency SMS. Alert messages are generated and summarized by Gemini before dispatch.

### 🏥 Health Record Agent
Maintains a **Universal Health Passport** across zoos, vets, and owners. Ensures data consistency, tracks vaccination history, and flags animals at quarantine risk.

### 📊 Analytics Agent
Runs population management queries on **Google BigQuery** — species inbreeding coefficient (CoI) ranking, genetic diversity index by institution, and global transfer efficiency. Embeds Looker Studio reports.

---

## 🛠️ Tech Stack

| Category | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 19 + TypeScript | Component-based UI with full type safety |
| **Build Tool** | Vite 8 | Sub-second HMR and optimised production builds |
| **Styling** | Tailwind CSS v4 | Utility-first CSS with custom design token architecture |
| **Charts** | Recharts | Area and bar charts for SLA and alert dashboards |
| **Maps** | Google Maps JS API + Visualization API | Zoonotic outbreak heatmap with weighted severity layers |
| **Map Loader** | `@googlemaps/js-api-loader` | Singleton script loader — one Maps instance across all components |
| **Icons** | Lucide React | Consistent icon system |
| **HTTP Client** | Axios | Typed API calls from frontend to FastAPI backend |
| **Backend Framework** | FastAPI (Python 3.12+) | High-performance async REST API |
| **ASGI Server** | Uvicorn | Production-grade async server |
| **Validation** | Pydantic v2 + pydantic-settings | Request/response schemas and `.env` config management |
| **Agent Orchestration** | Custom Intent Registry | Modular agent routing with no framework lock-in |
| **Background Jobs** | Celery + Redis | Async SLA monitoring and scheduled alert dispatch |
| **LLM** | Gemini 1.5 Flash (`google-genai`) | Agent reasoning, alert generation, blueprint summarization |
| **Embeddings** | `text-embedding-004` | Semantic vector search for the Matching Agent |
| **Document Extraction** | Google Cloud Document AI | Structured field extraction from CITES permits and vet certificates |
| **Analytics Warehouse** | Google Cloud BigQuery | Species inbreeding CoI, genetic diversity index, transfer efficiency |
| **BI Reporting** | Looker Studio | Embedded stakeholder dashboards backed by BigQuery |
| **Email Alerts** | Gmail API (OAuth2) | Transactional outbreak and SLA breach notifications |
| **SMS Alerts** | Twilio | Emergency SMS for critical zoonotic events |
| **Relational DB** | PostgreSQL on Neon | Transfers, audit logs, permit records |
| **Graph DB** | Neo4j AuraDB | Animal lineage, zoo relationships, and risk edges |
| **Auth (planned)** | Firebase Authentication | Google SSO for institutional access control |
| **Secrets (planned)** | Google Cloud Secret Manager | Production-grade API key management |

---

## 🚀 Running Locally

### Prerequisites
- Python 3.12+ (Anaconda recommended)
- Node.js 20+

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # Fill in your API keys
python -m uvicorn app.main:app --reload
# Runs at http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # Add VITE_GOOGLE_MAPS_API_KEY
npm run dev
# Runs at http://localhost:5173
```

### Environment Variables

**`backend/.env`**
```env
GEMINI_API_KEY=your_gemini_key
DATABASE_URL=postgresql://...
NEO4J_URI=neo4j+s://...
BIGQUERY_PROJECT_ID=your_gcp_project
```

**`frontend/.env`**
```env
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key
```

---

## 🗺️ Roadmap

- [x] FastAPI backend with 6 core agents
- [x] React + Tailwind frontend (landing page + dashboard)
- [x] Google Document AI integration (permit extraction)
- [x] Google Maps heatmap (zoonotic outbreak visualization)
- [x] Google BigQuery analytics agent + Looker Studio embed
- [x] Multi-channel alerts (Gmail + Twilio)
- [x] Neo4j knowledge graph schema
- [ ] Production deployment (Cloud Run + Vercel)
- [ ] Firebase Authentication (Google SSO)
- [ ] Celery + Redis workers (live SLA monitoring)
- [ ] Google Cloud Vision (microchip photo verification)
