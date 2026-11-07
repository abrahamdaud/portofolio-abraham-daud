(() => {
  try {
    const savedTheme = localStorage.getItem('abraham-daud-theme');
    if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  } catch {
    document.documentElement.dataset.theme = 'light';
  }

  const totalCount = document.querySelector('#total-count');
  const year = document.querySelector('#visitor-year');
  const cachedTotalKey = 'abraham-daud-total-visits-cache';

  if (year) year.textContent = new Date().getFullYear();

  function setTotalCount(value) {
    if (totalCount && value !== null && value !== undefined) {
      totalCount.textContent = Number(value).toLocaleString('id-ID');
    }
    try {
      localStorage.setItem(cachedTotalKey, String(value));
    } catch {
      // The server count remains available if local storage is disabled.
    }
  }

  try {
    const cachedTotal = localStorage.getItem(cachedTotalKey);
    if (cachedTotal !== null) setTotalCount(cachedTotal);
  } catch {
    // Continue with the server count if local storage is unavailable.
  }

  async function loadSavedCount() {
    try {
      await window.portfolioVisitTracked;
      const response = await fetch('/api/visitors', { cache: 'no-store' });
      if (!response.ok) throw new Error('Visitor count request failed.');

      const result = await response.json();
      setTotalCount(result.total);
    } catch {}
  }

  loadSavedCount();
})();