# ArkFlow Connect — AI-Powered Animal Health & Transfer Platform

[![Hackathon](https://img.shields.io/badge/Hackathon-MyHack%202026-blue)](https://myhack.gdg.dev)
[![Team](https://img.shields.io/badge/Team-saltAndPepperChips-orange)](#)
[![Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20React%20%7C%20Gemini-green)](#)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](#)

> **Programmable relationships for the animal health economy** — connecting zoos, vets, and regulators through AI-native workflows, live SLA monitoring, and a real-time zoonotic alert system.

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

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 (custom token architecture) |
| Charts | Recharts |
| Maps | Google Maps JavaScript API + Visualization API (Heatmap) |
| Icons | Lucide React |

### Backend
| Layer | Technology |
|---|---|
| API Framework | FastAPI (Python 3.12+) |
| Server | Uvicorn (ASGI) |
| Validation | Pydantic v2 |
| Background Jobs | Celery + Redis |
| Agent Orchestration | Custom Intent-Based Registry (no framework lock-in) |

### Google Cloud & AI
| Service | Usage |
|---|---|
| **Gemini 1.5 Flash** | Agent reasoning, alert summarization, blueprint generation |
| **Google Cloud Document AI** | CITES permit + health certificate extraction |
| **Google Cloud BigQuery** | Population analytics, transfer efficiency at scale |
| **Google Maps JS API** | Zoonotic outbreak heatmap + animal location markers |
| **Looker Studio** | Embedded stakeholder reports (Diversity Index, SLA Compliance) |
| **Gmail API** | Transactional alert emails |

### Databases
| Database | Role |
|---|---|
| PostgreSQL (Neon) | Transactional data, audit logs, transfer records |
| Neo4j AuraDB | Knowledge graph: animal lineage, zoo relationships, risk edges |

### Notifications
| Channel | Provider |
|---|---|
| Email | Gmail API (OAuth2) |
| SMS | Twilio |

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

---

## 👥 Team

**saltAndPepperChips** — GDG MyHack 2026

| Name | Role | Responsibilities |
|------|------|-----------------|
| **Krishna** | Backend Developer | FastAPI agents, database schemas, deployment, video pitch |
| **Francis** | Frontend Developer & Business Lead | React UI, UX design, business strategy, market research |
