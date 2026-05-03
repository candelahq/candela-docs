# Quick Start

Send your first traced LLM request in under 5 minutes using **candela-local**.

## 1. Start candela-local

```bash
candela-local
```

This starts two listeners:

- `:8181` — Management UI + proxy
- `:1234` — LM-compatible endpoint (works with JetBrains, Cline, etc.)

## 2. Point Your App at Candela

Route LLM requests through candela-local instead of calling providers directly:

=== "curl"

    ```bash
    curl http://localhost:1234/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "llama3.2:3b",
        "messages": [{"role": "user", "content": "Hello, Candela!"}]
      }'
    ```

=== "Python (OpenAI SDK)"

    ```python
    from openai import OpenAI

    client = OpenAI(
        base_url="http://localhost:1234/v1",
        api_key="candela",  # placeholder — candela-local handles auth
    )

    response = client.chat.completions.create(
        model="llama3.2:3b",
        messages=[{"role": "user", "content": "Hello, Candela!"}],
    )
    print(response.choices[0].message.content)
    ```

=== "Python (ADK)"

    ```python
    from google.adk.agents import Agent
    from google.adk.models import Gemini

    agent = Agent(
        model=Gemini(
            model="gemini-2.0-flash",
            base_url="http://localhost:8181/proxy/google",
        ),
        name="my_agent",
        instruction="You are a helpful assistant.",
    )
    ```

=== "Go"

    ```go
    client := openai.NewClient(
        option.WithBaseURL("http://localhost:1234/v1"),
        option.WithAPIKey("candela"),
    )
    ```

## 3. View the Trace

Open the management UI at **http://localhost:8181/_local/** and check the **Traces** card. You'll see your request with:

- ⏱️ **Latency** — End-to-end request duration
- 📊 **Token usage** — Input and output token counts
- 💰 **Cost estimate** — Based on provider pricing
- 🔗 **Trace context** — W3C Trace Context propagation

## 4. Discover Models

See all available models (local + cloud) in one place:

```bash
curl http://localhost:1234/v1/models | jq '.data[].id'
```

---

!!! tip "What's next?"
    - [Configure cloud models (Gemini, Claude)](../local/index.md) in Solo + Cloud mode
    - [Deploy to production](../sidecar/deployment.md) with candela-sidecar
    - [Integrate with Google ADK](../guides/adk-integration.md) for distributed tracing
