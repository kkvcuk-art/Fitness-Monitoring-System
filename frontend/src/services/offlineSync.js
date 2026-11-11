const QUEUE_KEY = 'phc-offline-sync-queue-v1';

export function queueForSync(payload) {
  const current = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  current.push({ ...payload, queuedAt: new Date().toISOString() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(current.slice(-250)));
}

export function getSyncQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
}

export function clearSyncQueue() { localStorage.removeItem(QUEUE_KEY); }
