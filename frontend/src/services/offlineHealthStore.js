const KEY = 'phc-offline-health-readings-v1';

function readAll() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function saveOfflineHealthReading(reading) {
  const item = { ...reading, storedAt: new Date().toISOString(), localOnly: true };
  const next = [item, ...readAll()].slice(0, 250);
  localStorage.setItem(KEY, JSON.stringify(next));
  return item;
}

export function getOfflineHealthReadings() { return readAll(); }

export function clearOfflineHealthReadings() { localStorage.removeItem(KEY); }

export function getOfflineStatus() {
  return { online: navigator.onLine, queuedReadings: readAll().length, localInferenceAvailable: true };
}
