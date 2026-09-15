# MPLADS Platform - Monorepo

Integrated digital platform for the **Member of Parliament Local Area Development Scheme (MPLADS)** incorporating AI-driven fraud detection, GIS geospatial mapping, automated SLA workflow tracking, and multi-tier role oversight.

---

## 🏛️ Architecture Overview

```
mplads-platform/
├── docker-compose.yml              # Multi-container orchestration
├── README.md
├── .env.example
├── apps/
│   ├── web/                        # React 18 + Tailwind CSS + Vite Dashboard
│   ├── backend-api/                # Node.js + Express + TypeScript REST API
│   └── ml-engine/                  # Python 3.11+ FastAPI AI Engine (SBERT, pHash, SHAP)
└── storage/                        # Persistent file mounts
    ├── uploads/                    # Field geotagged photos
    └── docs/                       # Technical sanction PDFs
```

---

## 👥 Role-Based Portals

1. **Member of Parliament (MP)**: Submit work recommendations, monitor ₹5 Cr annual entitlement, view constituency progress map.
2. **District Authority (DA)**: Review recommendation inbox, conduct administrative/technical sanctions within 75-day SLA, assign Implementing Agencies.
3. **Implementing Agency (IA)**: Upload EXIF-geotagged site photos, report milestone completions, request fund releases.
4. **Central/State Nodal Admin**: Monitor national risk matrix, inspect SHAP AI fraud explainability cards, audit SLA breaches.
5. **Citizen Oversight Portal**: Interactive Leaflet transparency map, public work search, geo-fenced fraud reporting with proof upload.

---

## 🛠️ Quickstart

### Prerequisites
- Docker & Docker Compose
- Node.js v18+ & npm
- Python 3.11+

### Running with Docker Compose
```bash
cp .env.example .env
docker-compose up --build
```

- Web Dashboard: http://localhost:3000
- Backend API: http://localhost:5000
- ML Engine: http://localhost:8000
