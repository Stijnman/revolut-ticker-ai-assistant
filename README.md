# Revolut Ticker Agent - Browser Extension

A browser extension that detects stock tickers on Revolut Invest pages and provides real-time investment signals.

## Features

- **Automatic Ticker Detection**: Scans Revolut pages for stock symbols
- **Real-time Data**: Fetches latest price, daily low/high from Finnhub API
- **Smart Indicators**: Shows green (good) or red (caution) indicators based on price position
- **Persistent Memory**: Remembers previous checks to reduce API calls
- **Rate Limiting**: Respects API limits (1.5s between calls)
- **Learning**: Improves over time based on historical performance

## Installation

1. Download this folder
2. Go to `chrome://extensions/` (or `edge://extensions/`)
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select this folder

## Configuration

1. Get a free API key from [Finnhub](https://finnhub.io)
2. Open `background.js` and replace `YOUR_FINNHUB_API_KEY_HERE` with your actual key
3. Reload the extension

## How It Works

1. Extension detects ticker symbols on Revolut pages
2. Sends ticker to Finnhub API (rate-limited)
3. Calculates position in daily range: `(current - low) / (high - low)`
4. Shows **green** if price is in bottom 35% of range (closer to low)
5. Shows **red** if price is in top 65% of range (closer to high)
6. Stores results in persistent memory for future reference

## Files

- `manifest.json` - Extension configuration
- `content.js` - Detects tickers on page
- `background.js` - Handles API calls and memory
- `popup.html/js` - Simple status popup

## Rate Limiting

- 1.5 seconds between API calls
- Uses cached data when available (5-minute cache)

## Security

- API key stored in background script (never exposed to content)
- All data stored locally in browser

---

**Version 1.0.0** | Built for Revolut Invest pages | 2026-05-18