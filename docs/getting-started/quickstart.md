# Quick Start

Send your first traced LLM request in under 5 minutes.

## 1. Start the Sidecar

```bash
candela-sidecar --port 8080 --provider gemini
```

## 2. Point Your App at Candela

Instead of calling your LLM provider directly, route through the sidecar:

=== "curl"

    ```bash
    curl http://localhost:8080/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "gemini-2.0-flash",
        "messages": [{"role": "user", "content": "Hello, Candela!"}]
      }'
    ```

=== "Python"

    ```python
    from openai import OpenAI

    client = OpenAI(
        base_url="http://localhost:8080/v1",
        api_key="your-api-key",
    )

    response = client.chat.completions.create(
        model="gemini-2.0-flash",
        messages=[{"role": "user", "content": "Hello, Candela!"}],
    )
    print(response.choices[0].message.content)
    ```

=== "Go"

    ```go
    // Use the standard OpenAI-compatible client
    // pointed at the Candela sidecar
    client := openai.NewClient(
        option.WithBaseURL("http://localhost:8080/v1"),
        option.WithAPIKey("your-api-key"),
    )
    ```

## 3. View the Trace

Open **Candela Desktop** and navigate to the **Traces** tab. You'll see your request with:

- ⏱️ **Latency** — End-to-end request duration
- 📊 **Token usage** — Input and output token counts
- 💰 **Cost estimate** — Based on provider pricing
- 🔗 **Trace context** — W3C Trace Context propagation

!!! tip "What's next?"
    - [Configure multiple providers](../desktop/providers.md)
    - [Deploy to production](../sidecar/deployment.md)
    - [Integrate with Google ADK](../guides/adk-integration.md)
