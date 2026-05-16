-- Enable pgvector for embedding similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Animals with embedding for transfer matching
CREATE TABLE IF NOT EXISTS animals (
    id          SERIAL PRIMARY KEY,
    microchip_id TEXT UNIQUE NOT NULL,
    name        TEXT,
    species     TEXT NOT NULL,
    sex         TEXT,
    age         NUMERIC,
    zoo_id      TEXT,
    embedding   vector(768),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Health records (written by HealthRecordAgent)
CREATE TABLE IF NOT EXISTS health_records (
    id           SERIAL PRIMARY KEY,
    microchip_id TEXT NOT NULL,
    test_name    TEXT NOT NULL,
    result       TEXT NOT NULL,
    record_date  TEXT NOT NULL,
    vet_clinic   TEXT NOT NULL,
    zoonotic_flag BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_records_microchip ON health_records(microchip_id);

-- Transfers (read by SLAAgent._check)
CREATE TABLE IF NOT EXISTS transfers (
    id              SERIAL PRIMARY KEY,
    microchip_id    TEXT NOT NULL,
    from_zoo_id     TEXT NOT NULL,
    to_zoo_id       TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',
    deadline        TIMESTAMPTZ,
    escalation_count INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- SLA events (read by SLAAgent._monitor_all)
CREATE TABLE IF NOT EXISTS sla_events (
    id               SERIAL PRIMARY KEY,
    transfer_id      INT REFERENCES transfers(id),
    deadline         TIMESTAMPTZ NOT NULL,
    status           TEXT NOT NULL DEFAULT 'active',
    escalation_count INT DEFAULT 0,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sla_events_status ON sla_events(status);
CREATE INDEX IF NOT EXISTS idx_sla_events_deadline ON sla_events(deadline);
