# BioTensor Lab — Monorepo (Timescale + pgvector demo)

A production-grade multimodal biomedical platform with real-time signal processing and AI inference.

## Features

- **Real-time Signal Streaming** - EEG/ECG/HRV data ingestion and visualization
- **TimescaleDB Integration** - Efficient time-series data storage with hypertables
- **AI Inference Pipeline** - Feature extraction and prediction with pluggable models
- **Modern Web Interface** - Next.js with real-time charts and dashboards
- **Microservices Architecture** - NestJS API + FastAPI inference service
- **HIPAA-Ready Foundation** - Security and compliance considerations built-in

## Architecture

```
apps/
├── web/          # Next.js frontend with real-time charts
├── api/          # NestJS backend with TypeORM + TimescaleDB
└── inference/    # FastAPI ML inference service

packages/
├── ui/           # Shared React components
├── types/        # Shared TypeScript types
└── config/       # Shared configuration
```

## Quick Start

### Using Docker (Recommended)

```bash
# Copy environment files
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
cp apps/inference/.env.example apps/inference/.env

# Start all services
docker compose up --build
```

### Local Development

```bash
# Install dependencies
pnpm install

# Run services (in separate terminals)
pnpm --filter @biotensor/web dev
pnpm --filter @biotensor/api start:dev
pnpm --filter @biotensor/inference dev
```

## Access Points

- **Web App**: http://localhost:3000
- **API Health**: http://localhost:4000/health
- **Inference Docs**: http://localhost:8000/docs

## Demo Features

1. **Live Stream Demo** (`/app/stream`)
   - Synthetic ECG data generation
   - Real-time chart visualization
   - Signal chunk storage in TimescaleDB

2. **Prediction Pipeline** (`/app`)
   - Feature extraction (mean, std, RMS)
   - ML model inference
   - Result visualization

3. **Signal Processing API**
   - `POST /signals/ingest` - Ingest time-series data
   - `GET /signals/recent` - Query recent signals
   - `POST /signals/extract-and-predict` - Extract features and predict

## Technology Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Recharts
- **Backend**: NestJS, TypeORM, PostgreSQL/TimescaleDB
- **Inference**: FastAPI, NumPy, Pydantic
- **Infrastructure**: Docker, Docker Compose
- **Monitoring**: PostHog (analytics), Health endpoints

## Next Steps

- [ ] Add real DSP algorithms for ECG/EEG feature extraction
- [ ] Integrate pgvector for similarity search
- [ ] Implement Temporal workflows for batch processing
- [ ] Add WebAssembly modules for client-side signal processing
- [ ] Enhance security with OIDC/SAML authentication
- [ ] Add audit logging and PHI encryption