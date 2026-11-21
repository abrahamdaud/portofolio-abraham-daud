(() => {
  const registeredKey = 'abraham-daud-visitor-registered';
  let alreadyRegistered = false;

  try {
    alreadyRegistered = localStorage.getItem(registeredKey) === 'true';
  } catch {
    alreadyRegistered = false;
  }

  if (alreadyRegistered) {
    window.portfolioVisitTracked = Promise.resolve();
    return;
  }

  // Identitas pengunjung ditentukan server lewat cookie HttpOnly.
  // Reload, tab baru, atau restart browser tidak menambah hitungan lagi.
  window.portfolioVisitTracked = fetch('/api/visitors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
    credentials: 'same-origin',
    keepalive: true
  }).then((response) => {
    if (!response.ok) throw new Error('Visit could not be recorded.');
    try {
      localStorage.setItem(registeredKey, 'true');
    } catch {
      // Server tetap melakukan deduplikasi lewat cookie pengunjung.
    }
  }).catch(() => undefined);
})();
