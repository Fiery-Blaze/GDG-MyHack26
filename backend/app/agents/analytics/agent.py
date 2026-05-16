"""
Analytics Agent — Google BigQuery integration.

Executes population management queries against a BigQuery dataset and returns
structured results. Falls back to mock data when the BQ client is not configured.

BigQuery setup:
  1. Create a GCP project and enable the BigQuery API.
  2. Create dataset: `arkflow`
  3. Set BIGQUERY_PROJECT_ID in backend/.env
  4. Authenticate: `gcloud auth application-default login`
     or set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON key.
"""

from __future__ import annotations

import os
import logging
from typing import Any

from app.agents.base import BaseAgent

logger = logging.getLogger(__name__)

# Optional BigQuery dependency — only imported if installed and configured.
try:
    from google.cloud import bigquery  # type: ignore
    _BQ_AVAILABLE = True
except ImportError:
    _BQ_AVAILABLE = False
    logger.warning("google-cloud-bigquery not installed. Install it with: pip install google-cloud-bigquery")


# ── Mock data (used when BigQuery is not configured) ─────────────────────────
_MOCK_SPECIES_RISK = [
    {"species_name": "Javan Rhino", "population_size": 11, "avg_coi": 0.47, "risk_level": "CRITICAL"},
    {"species_name": "Amur Leopard", "population_size": 87, "avg_coi": 0.34, "risk_level": "CRITICAL"},
    {"species_name": "Sumatran Orangutan", "population_size": 312, "avg_coi": 0.21, "risk_level": "CRITICAL"},
    {"species_name": "Black-footed Ferret", "population_size": 206, "avg_coi": 0.18, "risk_level": "HIGH"},
    {"species_name": "Snow Leopard", "population_size": 480, "avg_coi": 0.09, "risk_level": "MODERATE"},
    {"species_name": "Bengal Tiger", "population_size": 890, "avg_coi": 0.07, "risk_level": "LOW"},
]

_MOCK_TRANSFER_EFFICIENCY = [
    {"month": "2025-11", "total_transfers": 14, "completed": 12, "delayed": 2, "sla_compliance_pct": 85.7},
    {"month": "2025-12", "total_transfers": 18, "completed": 15, "delayed": 3, "sla_compliance_pct": 83.3},
    {"month": "2026-01", "total_transfers": 22, "completed": 20, "delayed": 2, "sla_compliance_pct": 90.9},
    {"month": "2026-02", "total_transfers": 19, "completed": 18, "delayed": 1, "sla_compliance_pct": 94.7},
    {"month": "2026-03", "total_transfers": 26, "completed": 21, "delayed": 5, "sla_compliance_pct": 80.8},
    {"month": "2026-04", "total_transfers": 31, "completed": 28, "delayed": 3, "sla_compliance_pct": 90.3},
    {"month": "2026-05", "total_transfers": 34, "completed": 29, "delayed": 5, "sla_compliance_pct": 85.3},
]


class AnalyticsAgent(BaseAgent):
    """
    Agent for querying ArkFlow's BigQuery analytics dataset.

    Supported intents:
      - analytics_bigquery   : Execute a raw SQL query against BigQuery.
      - analytics_species_risk : Return the species inbreeding risk ranking.
      - analytics_transfer_efficiency : Return monthly transfer efficiency stats.
    """

    handles = [
        "analytics_bigquery",
        "analytics_species_risk",
        "analytics_transfer_efficiency",
    ]

    def __init__(self) -> None:
        self._project_id: str | None = os.getenv("BIGQUERY_PROJECT_ID")
        self._client: Any = None

        if _BQ_AVAILABLE and self._project_id:
            try:
                self._client = bigquery.Client(project=self._project_id)
                logger.info("BigQuery client initialised for project: %s", self._project_id)
            except Exception as exc:
                logger.warning("BigQuery client init failed: %s", exc)

    # ── Public interface ─────────────────────────────────────────────────────

    async def run(self, intent: str, payload: dict) -> dict:
        if intent == "analytics_bigquery":
            return await self._run_query(payload.get("query", ""))
        if intent == "analytics_species_risk":
            return await self._species_risk()
        if intent == "analytics_transfer_efficiency":
            return await self._transfer_efficiency()
        return {"success": False, "error": f"Unknown intent: {intent}"}

    async def health_check(self) -> bool:
        return self._client is not None

    # ── Private helpers ──────────────────────────────────────────────────────

    async def _run_query(self, sql: str) -> dict:
        """Execute arbitrary SQL. Falls back to mock if BQ not configured."""
        if not sql.strip():
            return {"success": False, "error": "No SQL query provided."}

        if self._client is None:
            return {
                "success": True,
                "source": "mock",
                "note": "BigQuery not configured — set BIGQUERY_PROJECT_ID in backend/.env",
                "data": _MOCK_SPECIES_RISK,
            }

        try:
            job = self._client.query(sql)
            rows = [dict(row) for row in job.result()]
            return {
                "success": True,
                "source": "bigquery",
                "jobId": job.job_id,
                "rowsProcessed": job.num_dml_affected_rows or len(rows),
                "bytesProcessed": job.total_bytes_processed,
                "data": rows,
            }
        except Exception as exc:
            logger.error("BigQuery query error: %s", exc)
            return {"success": False, "error": str(exc)}

    async def _species_risk(self) -> dict:
        sql = """
        SELECT
            species_name,
            COUNT(individual_id) AS population_size,
            AVG(coefficient_of_inbreeding) AS avg_coi,
            CASE
                WHEN AVG(coefficient_of_inbreeding) > 0.25 THEN 'CRITICAL'
                WHEN AVG(coefficient_of_inbreeding) > 0.15 THEN 'HIGH'
                WHEN AVG(coefficient_of_inbreeding) > 0.05 THEN 'MODERATE'
                ELSE 'LOW'
            END AS risk_level
        FROM `{project}.animal_registry.individuals`
        WHERE is_active = TRUE
        GROUP BY species_name
        ORDER BY avg_coi DESC
        LIMIT 20
        """.format(project=self._project_id or "arkflow-demo")

        if self._client is None:
            return {"success": True, "source": "mock", "data": _MOCK_SPECIES_RISK}

        return await self._run_query(sql)

    async def _transfer_efficiency(self) -> dict:
        sql = """
        SELECT
            DATE_TRUNC(transfer_date, MONTH) AS month,
            COUNT(*) AS total_transfers,
            COUNTIF(status = 'completed') AS completed,
            COUNTIF(actual_duration > sla_duration) AS delayed,
            ROUND(AVG(SAFE_DIVIDE(sla_duration, actual_duration)) * 100, 1) AS sla_compliance_pct
        FROM `{project}.transfers.records`
        WHERE transfer_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
        GROUP BY 1
        ORDER BY 1
        """.format(project=self._project_id or "arkflow-demo")

        if self._client is None:
            return {"success": True, "source": "mock", "data": _MOCK_TRANSFER_EFFICIENCY}

        return await self._run_query(sql)
