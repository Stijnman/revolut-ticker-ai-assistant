# Revolut Ticker AI Assistant

Chrome MV3 extension: ticker detection on Revolut Invest, Finnhub quotes, alerts, and dashboard.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Install

1. `git clone https://github.com/Stijnman/revolut-ticker-ai-assistant.git`
2. Chrome → Extensions → Load unpacked → this folder
3. Set Finnhub key via `chrome.storage.local.set({ finnhubApiKey: "..." })`

## Files

| File | Role |
|------|------|
| `manifest.json` | MV3 config |
| `content.js` | Ticker detection |
| `background.js` | Finnhub + memory |
| `popup.*` | Quick UI |
| `dashboard.*` | Portfolio view |
| `alerts.*` | Alert rules UI |

## Security

- Never commit API keys
- Key lives in `chrome.storage.local`
- Rate limit: 1.5s between Finnhub calls

## Disclaimer

Not financial advice.

## License

MIT © 2026 Stijnman
