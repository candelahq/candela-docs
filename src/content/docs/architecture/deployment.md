---
title: Deployment Architecture
description: Production deployment topology for the Candela platform.
---

## Production Topology

```
                    ┌─────────────────────┐
Developer Machine   │  OpenCode / Zed     │
                    │  JetBrains / Cursor  │
                    │        │             │
                    │  candela              │
                    │  (:8181 / :1234)     │
                    └────────┬────────────┘
                             │ Bearer token (OIDC via ADC)
                             ▼
                    ┌─────────────────────┐
Google Cloud        │  Cloud Run          │
                    │  ┌────────────────┐ │
                    │  │ Next.js :3000  │ │
                    │  │   ↕ rewrite   │ │
                    │  │ Go API :8181  │ │
                    │  └───────┬────────┘ │
                    └──────────┼──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        ┌──────────┐    ┌──────────┐    ┌──────────┐
        │ BigQuery │    │Firestore │    │Vertex AI │
        │ (spans)  │    │(budgets) │    │(LLM API) │
        └──────────┘    └──────────┘    └──────────┘
```

## Components

| Component | Location | Purpose |
|---|---|---|
| **Go Backend** | `cmd/candela-server` | API, LLM proxy, span ingestion, auth, storage |
| **Next.js UI** | `ui/` | Dashboard, trace waterfall, costs, admin |
| **candela** | `cmd/candela` | CLI proxy injecting Google credentials for dev tools |
| **candela-sidecar** | `cmd/candela-sidecar` | Lightweight container proxy with Pub/Sub export |
| **Terraform** | `terraform/` | Cloud Run, BigQuery, Firestore, Firebase, IAM |

## Infrastructure as Code

All cloud resources are managed via Terraform in the `terraform/` directory:

| File | Resources |
|---|---|
| `cloud_run.tf` | Cloud Run service, IAM |
| `firebase.tf` | Firebase project, Identity Platform, authorized domains |
| `bigquery.tf` | Dataset + spans table (time-partitioned) |
| `firestore.tf` | Firestore database |
| `iam.tf` | Service account + role bindings |
| `artifact_registry.tf` | Container image registry |

## Build & Deploy

```bash
# Build container image
gcloud builds submit --project $PROJECT -f deploy/cloudbuild.yaml .

# Deploy to Cloud Run
gcloud run services update candela --project $PROJECT --region $REGION \
  --image $REGION-docker.pkg.dev/$PROJECT/candela/candela-server:latest

# Apply infrastructure
cd terraform && terraform apply
```
