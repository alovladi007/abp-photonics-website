# BioTensor Lab — Monorepo (Timescale + pgvector demo)

This scaffold now includes a **TimescaleDB**-backed signal-ingest pipeline, feature extraction, and prediction loop.

- **apps/web** — Next.js (App Router) + Tailwind + PostHog + demo chart `/app/stream`
- **apps/api** — NestJS + TypeORM + Timescale hypertables + endpoints:
  - `POST /signals/ingest`
  - `GET /signals/recent?patientId=&channel=&sinceMs=`
  - `POST /signals/extract-and-predict`
- **apps/inference** — FastAPI dummy model (swap to Triton/vLLM later)
- **infra/db/init.sql** — ensures `timescaledb` and `vector` extensions

## Quickstart

```bash
corepack enable && corepack prepare pnpm@latest --activate
pnpm install
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
cp apps/inference/.env.example apps/inference/.env

docker compose up --build
```

## Demo flow

1. In the web app, open **Live Stream Demo**.
2. Click **Start Demo Ingest** → sends synthetic ECG chunks to `/signals/ingest` and stores them in Timescale.
3. Click **Extract & Predict** → API computes mean/std/rms → calls inference → returns a score.

The DB bootstrap makes `signal_chunks` and `features` hypertables and ensures extensions exist.

## Next Steps

- Replace dummy features with real WASM/Python DSP for ECG/EEG/HRV.
- Add pgvector `RagChunk` table and embed de-identified notes for RAG.
- Introduce Temporal workflows for alerting and cohort exports.
- Add auth (OIDC/SAML), PHI encryption, audit hash-chains, and org-level RBAC.