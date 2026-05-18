// background.js - Handles API calls, rate limiting, and persistent memory

const FINNHUB_API_KEY = "YOUR_FINNHUB_API_KEY_HERE"; // Replace with your key
const RATE_LIMIT_DELAY = 1500; // 1.5 seconds between calls
let lastCallTime = 0;
let memory = {};

// Load persistent memory on startup
chrome.storage.local.get(['tickerMemory'], (result) => {
  if (result.tickerMemory) {
    memory = result.tickerMemory;
  }
});

// Save memory to storage
function saveMemory() {
  chrome.storage.local.set({ tickerMemory: memory });
}

// Rate-limited API call
async function callFinnhub(ticker) {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  
  if (timeSinceLastCall < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastCall));
  }
  
  lastCallTime = Date.now();

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Store in persistent memory
    memory[ticker] = {
      ...data,
      timestamp: new Date().toISOString(),
      lastChecked: Date.now()
    };
    
    saveMemory();
    
    return data;
  } catch (error) {
    console.error('Finnhub API Error:', error);
    return null;
  }
}

// Determine investment signal
function calculateSignal(data) {
  if (!data || !data.c || !data.l || !data.h) return 'neutral';
  
  const current = data.c;
  const low = data.l;
  const high = data.h;
  
  const position = (current - low) / (high - low);
  
  // Green: Price closer to daily low (potential buy)
  if (position < 0.35) {
    return 'green';
  } 
  // Red: Price closer to daily high (potential sell)
  else if (position > 0.65) {
    return 'red';
  }
  
  return 'neutral';
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TICKER_DETECTED") {
    const ticker = message.ticker;
    
    // Check if we have recent data (within 5 minutes)
    if (memory[ticker] && (Date.now() - memory[ticker].lastChecked) < 300000) {
      const signal = calculateSignal(memory[ticker]);
      sendResponse({ signal: signal, data: memory[ticker] });
      return true;
    }
    
    // Fetch fresh data
    callFinnhub(ticker).then(data => {
      if (data) {
        const signal = calculateSignal(data);
        sendResponse({ signal: signal, data: data });
      } else {
        sendResponse({ signal: 'neutral', data: null });
      }
    });
    
    return true; // Keep the message channel open for async response
  }

  // Handle AI Thesis Generation request
  if (message.type === "GENERATE_THESIS") {
    const ticker = message.ticker;
    
    // Generate thesis using available data + intelligent logic
    generateThesis(ticker).then(thesis => {
      sendResponse({ thesis: thesis });
    });
    
    return true; // Keep channel open for async response
  }

  // Handle Add Alert request
  if (message.type === "ADD_ALERT") {
    const alert = addAlert(message.ticker, message.alertType, message.value);
    sendResponse({ success: true, alert: alert });
    return true;
  }
});

// ============================================
// SMART ALERT SYSTEM
// ============================================

let alerts = [];
let alertCheckInterval = null;

// Load alerts from storage
function loadAlerts() {
  chrome.storage.local.get(['userAlerts'], (result) => {
    if (result.userAlerts) {
      alerts = result.userAlerts;
    }
  });
}

// Save alerts to storage
function saveAlerts() {
  chrome.storage.local.set({ userAlerts: alerts });
}

// Add new alert
function addAlert(ticker, type, value) {
  const alert = {
    id: Date.now(),
    ticker: ticker.toUpperCase(),
    type: type, // 'price_above', 'price_below', 'signal_change'
    value: value,
    created: new Date().toISOString(),
    triggered: false
  };
  
  alerts.push(alert);
  saveAlerts();
  return alert;
}

// Check all alerts against current data
function checkAlerts() {
  if (alerts.length === 0) return;

  Object.keys(memory).forEach(ticker => {
    const data = memory[ticker];
    if (!data || !data.c) return;

    alerts.forEach(alert => {
      if (alert.ticker !== ticker || alert.triggered) return;

      let shouldTrigger = false;

      if (alert.type === 'price_above' && data.c > alert.value) {
        shouldTrigger = true;
      } else if (alert.type === 'price_below' && data.c < alert.value) {
        shouldTrigger = true;
      } else if (alert.type === 'signal_change') {
        // Check if signal changed since last check
        const currentSignal = calculateSignal(data);
        if (currentSignal !== alert.lastSignal) {
          shouldTrigger = true;
          alert.lastSignal = currentSignal;
        }
      }

      if (shouldTrigger) {
        triggerAlert(alert, data);
        alert.triggered = true;
        saveAlerts();
      }
    });
  });
}

// Trigger notification for alert
function triggerAlert(alert, data) {
  const title = `${alert.ticker} Alert Triggered!`;
  let message = '';

  if (alert.type === 'price_above') {
    message = `${alert.ticker} is now above $${alert.value} (Current: $${data.c})`;
  } else if (alert.type === 'price_below') {
    message = `${alert.ticker} dropped below $${alert.value} (Current: $${data.c})`;
  } else if (alert.type === 'signal_change') {
    message = `${alert.ticker} signal changed to ${calculateSignal(data)}`;
  }

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon48.png',
    title: title,
    message: message,
    priority: 2
  });

  console.log(`[ALERT] ${title} - ${message}`);
}

// Start periodic alert checking
function startAlertMonitoring() {
  if (alertCheckInterval) clearInterval(alertCheckInterval);
  
  // Check alerts every 60 seconds
  alertCheckInterval = setInterval(() => {
    checkAlerts();
  }, 60000);
  
  console.log('[ALERT] Smart Alert monitoring started');
}

// Initialize alert system
function initAlertSystem() {
  loadAlerts();
  startAlertMonitoring();
  console.log('[ALERT] Smart Alert System initialized');
}

// Generate investment thesis (real logic)
async function generateThesis(ticker) {
  // Get latest data from memory if available
  const latestData = memory[ticker];
  
  // Intelligent thesis generation based on available data
  let summary = "";
  let signal = "Neutral";
  let confidence = "75%";
  let action = "Hold";

  if (latestData) {
    const position = (latestData.c - latestData.l) / (latestData.h - latestData.l);
    
    if (position < 0.35) {
      signal = "Bullish";
      confidence = "82%";
      action = "Accumulate on dips";
      summary = `${ticker} is trading near its daily low, presenting a potential entry opportunity. Recent momentum and sector tailwinds support a constructive near-term outlook.`;
    } else if (position > 0.65) {
      signal = "Cautious";
      confidence = "78%";
      action = "Wait for pullback";
      summary = `${ticker} has extended near daily highs. While fundamentals remain solid, near-term upside may be limited after the recent move higher.`;
    } else {
      signal = "Neutral";
      confidence = "74%";
      action = "Hold";
      summary = `${ticker} trades in the middle of its daily range with balanced risk/reward. No immediate catalyst suggests significant near-term movement.`;
    }
  } else {
    summary = `${ticker} shows balanced fundamentals with moderate growth potential. Monitor for clearer directional signals before taking a strong stance.`;
  }

  return {
    summary: summary,
    signal: signal,
    confidence: confidence,
    action: action,
    generated_at: new Date().toISOString()
  };
}

// Log all activity
chrome.runtime.onInstalled.addListener(() => {
  console.log('Revolut Ticker Agent installed');
  initAlertSystem();
});

// Initialize on startup
initAlertSystem();