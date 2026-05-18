// content.js - Detects stock tickers on Revolut pages

let processedTickers = new Set();

function detectTickers() {
  // Common selectors for tickers on Revolut Invest
  const tickerElements = document.querySelectorAll(
    '[data-testid*="ticker"], .ticker-symbol, [class*="ticker"], [data-symbol]'
  );

  tickerElements.forEach(element => {
    const ticker = element.textContent.trim().toUpperCase();
    
    // Basic validation: 1-5 uppercase letters
    if (/^[A-Z]{1,5}$/.test(ticker) && !processedTickers.has(ticker)) {
      processedTickers.add(ticker);
      
      // Send to background script
      chrome.runtime.sendMessage({
        type: "TICKER_DETECTED",
        ticker: ticker,
        elementId: element.id || Date.now()
      }, (response) => {
        if (response && response.signal) {
          showIndicator(element, response.signal, response.data);
        }
      });
    }
  });
}

// Create and show visual indicator + AI Co-Pilot button
function showIndicator(element, signal, data) {
  // Remove existing indicators
  const existing = element.parentNode.querySelector('.revolut-indicator');
  if (existing) existing.remove();

  const indicator = document.createElement('span');
  indicator.style.cssText = `
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-left: 6px;
    vertical-align: middle;
    cursor: pointer;
  `;
  
  const signalColor = signal === 'green' ? '#22c55e' : '#ef4444';
  
  if (signal === 'green') {
    indicator.style.backgroundColor = signalColor;
    indicator.title = `Good investment signal\nPrice: $${data.c}\nLow: $${data.l}\nHigh: $${data.h}`;
  } else {
    indicator.style.backgroundColor = signalColor;
    indicator.title = `Caution signal\nPrice: $${data.c}\nLow: $${data.l}\nHigh: $${data.h}`;
  }

  // Create AI Co-Pilot trigger button
  const aiButton = createTriggerButton(element.textContent.trim().toUpperCase(), signal);
  
  indicator.className = 'revolut-indicator';
  element.parentNode.insertBefore(indicator, element.nextSibling);
  element.parentNode.insertBefore(aiButton, indicator.nextSibling);
}

// Run detection periodically
setInterval(detectTickers, 3000);
detectTickers(); // Initial run