// dashboard.js - Portfolio Health Dashboard Logic

function loadPortfolioData() {
  chrome.storage.local.get(['tickerMemory'], (result) => {
    const memory = result.tickerMemory || {};
    const tickers = Object.keys(memory);
    
    // Calculate portfolio score
    let totalScore = 0;
    let validTickers = 0;
    
    const grid = document.getElementById('tickerGrid');
    grid.innerHTML = '';
    
    tickers.forEach(ticker => {
      const data = memory[ticker];
      if (!data || !data.c) return;
      
      validTickers++;
      
      // Calculate position in daily range (0 = at low, 1 = at high)
      const position = (data.c - data.l) / (data.h - data.l);
      const score = Math.round((1 - position) * 100); // Higher score = better (closer to low)
      totalScore += score;
      
      // Create ticker card
      const card = document.createElement('div');
      card.className = 'ticker-card';
      
      const signal = position < 0.35 ? 'green' : position > 0.65 ? 'red' : 'neutral';
      
      card.innerHTML = `
        <div>
          <div class="ticker-symbol">${ticker}</div>
          <div class="ticker-price">$${data.c} <span style="font-size: 12px; color: #64748b;">(${data.c > (data.l + data.h)/2 ? '+' : ''}${(data.c - (data.l + data.h)/2).toFixed(2)})</span></div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="text-align: right;">
            <div style="font-size: 11px; color: #64748b;">Score</div>
            <div style="font-weight: 700; font-size: 16px;">${score}</div>
          </div>
          <div class="signal-dot ${signal}"></div>
        </div>
      `;
      
      grid.appendChild(card);
    });
    
    // Calculate and display overall portfolio score
    const avgScore = validTickers > 0 ? Math.round(totalScore / validTickers) : 0;
    document.getElementById('portfolioScore').textContent = avgScore;
    document.getElementById('tickerCount').textContent = validTickers;
    
    // Color the score based on value
    const scoreEl = document.getElementById('portfolioScore');
    if (avgScore >= 70) {
      scoreEl.style.color = '#22c55e';
    } else if (avgScore >= 40) {
      scoreEl.style.color = '#eab308';
    } else {
      scoreEl.style.color = '#ef4444';
    }
  });
}

// Auto-refresh every 30 seconds
setInterval(loadPortfolioData, 30000);

// Initial load
document.addEventListener('DOMContentLoaded', loadPortfolioData);