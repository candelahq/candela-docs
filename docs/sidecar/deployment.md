# Deploying the Sidecar

## Kubernetes Sidecar Pattern

Add the Candela Sidecar as a sidecar container in your pod:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-ai-app
spec:
  template:
    spec:
      containers:
        - name: app
          image: my-ai-app:latest
          env:
            - name: LLM_BASE_URL
              value: "http://localhost:8080/v1"
        
        - name: candela-sidecar
          image: ghcr.io/itsnotrocketscience/candela-sidecar:latest
          ports:
            - containerPort: 8080
          env:
            - name: CANDELA_PROVIDER
              value: gemini
            - name: CANDELA_EXPORT_METHOD
              value: pubsub
            - name: CANDELA_PUBSUB_TOPIC
              value: projects/my-project/topics/candela-spans
          resources:
            requests:
              cpu: 50m
              memory: 32Mi
            limits:
              cpu: 100m
              memory: 64Mi
```

## Docker Compose

```yaml
services:
  app:
    image: my-ai-app:latest
    environment:
      LLM_BASE_URL: http://candela-sidecar:8080/v1
    depends_on:
      - candela-sidecar

  candela-sidecar:
    image: ghcr.io/itsnotrocketscience/candela-sidecar:latest
    ports:
      - "8080:8080"
    environment:
      CANDELA_PROVIDER: gemini
      CANDELA_EXPORT_METHOD: stdout
```

## Cloud Run

```bash
gcloud run deploy my-ai-app \
  --image my-ai-app:latest \
  --set-env-vars LLM_BASE_URL=http://localhost:8080/v1 \
  --add-cloudsql-instances my-project:us-central1:my-instance
```

!!! warning "Cloud Run Sidecar Support"
    Cloud Run supports multi-container deployments. Ensure the sidecar container is configured as a dependency of your main container.
