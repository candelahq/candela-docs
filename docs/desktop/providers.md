# Provider Management

Candela Desktop lets you manage multiple LLM providers from a single interface.

## Supported Providers

| Provider | Auth Method | Status |
|---|---|---|
| **Google Gemini** | API Key / ADC | ✅ Supported |
| **OpenAI** | API Key | ✅ Supported |
| **Ollama** | None (local) | ✅ Supported |
| **LM Studio** | None (local) | ✅ Supported |
| **Anthropic** | API Key | 🔜 Planned |

## Adding a Provider

1. Open Candela Desktop
2. Navigate to **Settings → Providers**
3. Click **Add Provider**
4. Select the provider type and enter your credentials
5. Click **Test Connection** to verify

!!! note "Secure Storage"
    API keys are stored in your operating system's secure keychain (macOS Keychain, Linux Secret Service, Windows Credential Store) — never in plain text.
