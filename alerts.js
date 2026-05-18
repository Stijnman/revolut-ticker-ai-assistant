// alerts.js - Smart Alert Management UI

let alerts = [];

function loadAlerts() {
  chrome.storage.local.get(['userAlerts'], (result) => {
    alerts = result.userAlerts || [];
    renderAlerts();
  });
}

function saveAlerts() {
  chrome.storage.local.set({ userAlerts: alerts });
  renderAlerts();
}

function createAlert() {
  const ticker = document.getElementById('ticker').value.trim().toUpperCase();
  const type = document.getElementById('alertType').value;
  const value = parseFloat(document.getElementById('value').value);

  if (!ticker || (type !== 'signal_change' && isNaN(value))) {
    alert('Please fill all fields correctly');
    return;
  }

  chrome.runtime.sendMessage({
    type: "ADD_ALERT",
    ticker: ticker,
    alertType: type,
    value: value
  }, (response) => {
    if (response && response.success) {
      loadAlerts();
      // Clear form
      document.getElementById('ticker').value = '';
      document.getElementById('value').value = '';
    }
  });
}

function deleteAlert(id) {
  alerts = alerts.filter(a => a.id !== id);
  saveAlerts();
}

function renderAlerts() {
  const container = document.getElementById('alertList');
  container.innerHTML = '';

  if (alerts.length === 0) {
    container.innerHTML = '<p style="color: #6b7280;">No active alerts</p>';
    return;
  }

  alerts.forEach(alert => {
    const div = document.createElement('div');
    div.className = 'alert-item';
    
    let valueText = '';
    if (alert.type === 'price_above') valueText = `Above $${alert.value}`;
    else if (alert.type === 'price_below') valueText = `Below $${alert.value}`;
    else valueText = 'On Signal Change';

    div.innerHTML = `
      <div>
        <strong>${alert.ticker}</strong> — ${valueText}
        <div style="font-size: 11px; color: #9ca3af;">Created: ${new Date(alert.created).toLocaleDateString()}</div>
      </div>
      <button class="delete-btn" onclick="deleteAlert(${alert.id})">Delete</button>
    `;
    
    container.appendChild(div);
  });
}

// Listen for alert updates from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "ALERTS_UPDATED") {
    loadAlerts();
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadAlerts();
  
  // Update alert type field visibility
  const alertType = document.getElementById('alertType');
  const valueField = document.getElementById('valueField');
  
  alertType.addEventListener('change', () => {
    if (alertType.value === 'signal_change') {
      valueField.style.display = 'none';
    } else {
      valueField.style.display = 'block';
    }
  });
});