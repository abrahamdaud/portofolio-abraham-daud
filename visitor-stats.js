(() => {
  const root = document.documentElement;
  const themeToggle = document.querySelector('#visitor-theme-toggle');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  let savedTheme;

  try {
    savedTheme = localStorage.getItem('abraham-daud-theme');
  } catch {
    savedTheme = null;
  }

  function applyTheme(theme, savePreference = false) {
    const isDark = theme === 'dark';
    root.dataset.theme = isDark ? 'dark' : 'light';
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', isDark ? 'Aktifkan tema putih' : 'Aktifkan tema gelap');
    }
    if (themeColor) themeColor.content = isDark ? '#151d19' : '#ffffff';

    if (savePreference) {
      try {
        localStorage.setItem('abraham-daud-theme', isDark ? 'dark' : 'light');
      } catch {
        // The selected theme remains active until the page is closed.
      }
    }
  }

  applyTheme(savedTheme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
    });
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