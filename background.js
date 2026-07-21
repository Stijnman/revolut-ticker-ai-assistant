// background.js - Finnhub quotes, rate limiting, persistent memory
// Configure key: chrome.storage.local.set({ finnhubApiKey: "YOUR_KEY" })

const RATE_LIMIT_DELAY = 1500;
let lastCallTime = 0;
let memory = {};
let cachedApiKey = null;

chrome.storage.local.get(["tickerMemory", "finnhubApiKey"], (result) => {
  if (result.tickerMemory) memory = result.tickerMemory;
  if (result.finnhubApiKey) cachedApiKey = result.finnhubApiKey;
});

function saveMemory() {
  chrome.storage.local.set({ tickerMemory: memory });
}

function getApiKey() {
  return new Promise((resolve) => {
    if (cachedApiKey && cachedApiKey !== "YOUR_FINNHUB_API_KEY_HERE") {
      resolve(cachedApiKey);
      return;
    }
    chrome.storage.local.get(["finnhubApiKey"], (result) => {
      cachedApiKey = result.finnhubApiKey || "YOUR_FINNHUB_API_KEY_HERE";
      resolve(cachedApiKey);
    });
  });
}

async function callFinnhub(ticker) {
  const now = Date.now();
  const wait = RATE_LIMIT_DELAY - (now - lastCallTime);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallTime = Date.now();

  const key = await getApiKey();
  if (!key || key === "YOUR_FINNHUB_API_KEY_HERE") {
    console.warn("Finnhub API key not set (finnhubApiKey in chrome.storage.local)");
    return null;
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${encodeURIComponent(key)}`
    );
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    memory[ticker] = {
      ...data,
      timestamp: new Date().toISOString(),
      lastChecked: Date.now(),
    };
    saveMemory();
    return data;
  } catch (error) {
    console.error("Finnhub API Error:", error);
    return null;
  }
}

/** content.js expects 'green' | 'red' | 'neutral' */
function calculateSignal(data) {
  if (!data || data.c == null || data.l == null || data.h == null || data.h === data.l) {
    return "neutral";
  }
  const position = (data.c - data.l) / (data.h - data.l);
  if (position <= 0.35) return "green";
  if (position >= 0.65) return "red";
  return "neutral";
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === "TICKER_DETECTED" || request.type === "GET_QUOTE") {
    callFinnhub(request.ticker).then((data) => {
      sendResponse({
        data,
        signal: calculateSignal(data),
        memory: memory[request.ticker],
      });
    });
    return true;
  }
  if (request.type === "SET_API_KEY") {
    cachedApiKey = request.key || "";
    chrome.storage.local.set({ finnhubApiKey: cachedApiKey }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
  if (request.type === "GET_MEMORY") {
    sendResponse({ memory });
    return false;
  }
  return false;
});
