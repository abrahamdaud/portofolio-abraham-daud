(() => {
  const sessionIdKey = 'abraham-daud-visitor-session';
  const countedKey = 'abraham-daud-visitor-counted';
  let sessionId;

  try {
    if (sessionStorage.getItem(countedKey) === 'true') {
      window.portfolioVisitTracked = Promise.resolve();
      return;
    }

    sessionId = sessionStorage.getItem(sessionIdKey);
    if (!sessionId) {
      sessionId = window.crypto && window.crypto.randomUUID
        ? window.crypto.randomUUID()
        : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
      sessionStorage.setItem(sessionIdKey, sessionId);
    }
  } catch {
    sessionId = `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
  }

  window.portfolioVisitTracked = fetch('/api/visitors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
    keepalive: true
  }).then((response) => {
    if (!response.ok) throw new Error('Visit could not be recorded.');
    try {
      sessionStorage.setItem(countedKey, 'true');
    } catch {
      // The server deduplicates retries using the session id.
    }
  }).catch(() => undefined);
})();