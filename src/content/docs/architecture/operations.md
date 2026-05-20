---
title: Operations Runbook
description: Monitoring, incident response, and maintenance for production Candela deployments.
---

Day-to-day operations guide for running Candela in production on Google Cloud.

## Health Checks

```bash
# Local
curl http://localhost:8181/healthz

# Production (requires auth)
curl -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  https://candela-xxx.a.run.app/healthz
```

Response:
```json
{"status": "ok"}
{"status": "error", "detail": "..."}
```

---

## Monitoring

### Key Metrics

| Metric | Source | Alert Threshold |
|--------|-------|----------------|
| Request latency (p99) | Cloud Run metrics | > 5s |
| Error rate (5xx) | Cloud Run metrics | > 5% |
| Container startup time | Cloud Run metrics | > 30s |
| BigQuery write errors | Application logs | Any |
| Auth failures | `"all auth strategies failed"` | > 10/min |
| Circuit breaker trips | `"circuit breaker tripped"` | Any |
| Budget thresholds | `"🔔 budget alert"` | At 80%, 90%, 100% |
| Span buffer full | `"span processor buffer full"` | Any |
| Tetragon audit stream | `"tetragon audit stream"` | Disconnected |
| gRPC audit sink errors | `"audit sink write failed"` | Any |

### Log-Based Alerts

```bash
# Budget threshold alert
gcloud logging metrics create candela-budget-alert \
  --description="Candela budget threshold reached" \
  --log-filter='resource.type="cloud_run_revision"
    AND textPayload=~"budget alert"'

# Circuit breaker alert
gcloud logging metrics create candela-circuit-breaker \
  --description="Candela circuit breaker tripped" \
  --log-filter='resource.type="cloud_run_revision"
    AND textPayload=~"circuit breaker tripped"'
```

### Structured Log Fields

Candela uses `slog` with JSON output:

| Field | Description |
|-------|-------------|
| `provider` | LLM provider name |
| `model` | Model name |
| `tokens` | Total token count |
| `cost_usd` | Calculated cost |
| `latency` | Request duration |
| `user_id` | Authenticated user |
| `request_id` | Unique request ID |

---

## Deployment

### Manual Deploy to Cloud Run

```bash
PROJECT=your-gcp-project
REGION=us-central1

# Build and push
gcloud builds submit --project $PROJECT -f deploy/cloudbuild.yaml .

# Deploy
gcloud run services update candela \
  --project $PROJECT --region $REGION \
  --image $REGION-docker.pkg.dev/$PROJECT/candela/candela-server:latest
```

### Rolling Back

```bash
# List revisions
gcloud run revisions list --project $PROJECT --region $REGION --service candela

# Route 100% traffic to a previous revision
gcloud run services update-traffic candela \
  --project $PROJECT --region $REGION \
  --to-revisions=candela-00042-abc=100
```

---

## BigQuery Operations

### Cost Queries

```sql
-- Total cost by user, last 7 days
SELECT
  user_id,
  SUM(gen_ai_cost_usd) as total_cost,
  COUNT(*) as call_count,
  SUM(gen_ai_total_tokens) as total_tokens
FROM `candela.spans`
WHERE start_time > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
GROUP BY user_id
ORDER BY total_cost DESC
```

### Cost Optimization

| Optimization | Impact | Status |
|-------------|--------|--------|
| Time partitioning (`start_time`, DAY) | ~70% scan cost reduction | ✅ Configured |
| Clustering (`project_id`, `trace_id`) | ~50% for filtered queries | ✅ Configured |
| Partition expiration | Storage savings | Set in Terraform |
| BI Engine reservation | Sub-second dashboards | Enable in BQ console |

---

## Incident Response

### Backend Not Starting

1. Check Cloud Run logs: `gcloud run logs read --project $PROJECT --service candela`
2. Common causes:
   - Missing env vars → check `entrypoint.sh` substitution
   - Firestore connection failed → check project ID and IAM
   - BigQuery auth failed → check service account roles

### High Latency

1. Filter logs by `provider` to identify slow upstream
2. Check circuit breaker state in logs
3. Check BigQuery slot usage (if using BQ as reader)
4. Check Cloud Run instance count (may need `min-instances > 0`)

### Budget Not Enforcing

1. Check Firestore `budgets/{userId}` document
2. Verify `period_start` is in the current period
3. Inspect `grants/` subcollection for grant absorption
4. Search logs for `"failed to deduct spend"`

### Proxy Returns 502

1. Check upstream provider status (OpenAI, Vertex AI, Anthropic)
2. Look for `"circuit breaker tripped"` logs
3. Check ADC token refresh: `"failed to get ADC token"`
4. Verify `vertex_ai.project_id` and region in config

### Tetragon Audit Pipeline

1. Verify Tetragon is running: `kubectl get pods -n kube-system -l app.kubernetes.io/name=tetragon`
2. Check gRPC audit stream connection: search logs for `"tetragon audit stream"`
3. Inspect `MultiSink` routing: each audit event should fan out to all configured sinks
4. If events are missing, check `CloseSend()` / graceful shutdown logs for premature stream termination
5. Verify `TracingPolicy` is applied: `kubectl get tracingpolicies`

---

## Maintenance

### Updating Model Pricing & Adding New Models

When you want to add new models (like Gemini 3.5 Flash) or update built-in model pricing, you have two options:

#### Option A: Update Code Defaults (Requires Build & Redeploy)
This is the recommended approach for adding new models long-term so that the proxy ships with correct built-in default rates.
1. **Modify Defaults:** Update the list of models in `pkg/costcalc/calculator.go` within `loadDefaults()`.
2. **Write Tests:** Add test cases checking the pricing calculation logic in `pkg/costcalc/calculator_test.go`.
3. **Run Tests:** Verify correctness locally:
   ```bash
   go test ./pkg/costcalc -v
   ```
4. **Build and Redeploy:** Run the build pipeline and redeploy to Google Cloud Run:
   ```bash
   # Build the container image
   gcloud builds submit --project $PROJECT -f deploy/cloudbuild.yaml .

   # Redeploy the Cloud Run service to apply the update
   gcloud run services update candela \
     --project $PROJECT --region $REGION \
     --image $REGION-docker.pkg.dev/$PROJECT/candela/candela-server:latest
   ```

#### Option B: Configure Runtime Overrides (No Code Changes Required)
You can override model pricing or add temporary support for a new model without rebuilding/redeploying code by modifying your active configuration:

1. **Config File (`config.yaml`):** Add per-model overrides under the `pricing.models` block:
   ```yaml
   pricing:
     models:
       - provider: google
         model: gemini-3.5-flash
         input_per_million: 0.40      # Negociated rate (List: $0.50)
         output_per_million: 2.40     # Negociated rate (List: $3.00)
   ```
   *Note: If you update `config.yaml` for a deployed service, redeploy or restart the Cloud Run service to load the new config.*

2. **Runtime Configuration Endpoint:** You can dynamically update configuration parameters and pricing overrides instantly without service restarts:
   ```bash
   curl -X POST http://localhost:8181/_local/api/config \
     -H "Content-Type: application/json" \
     -d '{"pricing": {"models": [{"provider": "google", "model": "gemini-3.5-flash", "input_per_million": 0.40, "output_per_million": 2.40}]}}'
   ```


### Database Migrations

All backends auto-provision their schema on startup:

| Backend | Strategy | Notes |
|---------|----------|-------|
| DuckDB | Auto `CREATE TABLE` | No manual migrations |
| SQLite | Auto `CREATE TABLE` | No manual migrations |
| BigQuery | Auto schema update | Column additions are backward-compatible |
| Firestore | Schema-less | Field additions are backward-compatible |

## Related

- [Deployment Architecture](/architecture/deployment/) — Production topology
- [Storage & CQRS](/architecture/storage/) — Backend configuration
- [Security](/architecture/security/) — Authentication and authorization
