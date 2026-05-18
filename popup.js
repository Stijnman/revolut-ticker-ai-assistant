document.addEventListener('DOMContentLoaded', () => {
  // Load memory stats
  chrome.storage.local.get(['tickerMemory'], (result) => {
    const count = result.tickerMemory ? Object.keys(result.tickerMemory).length : 0;
    document.getElementById('count').textContent = count;
  });

  // Clear memory button
  document.getElementById('clear').addEventListener('click', () => {
    chrome.storage.local.remove('tickerMemory', () => {
      document.getElementById('count').textContent = '0';
      document.getElementById('log').innerHTML = '<div>Memory cleared</div>';
    });
  });

  // Show recent activity (simplified)
  const logDiv = document.getElementById('log');
  logDiv.innerHTML = '<div>Agent is running in background...</div>';
});