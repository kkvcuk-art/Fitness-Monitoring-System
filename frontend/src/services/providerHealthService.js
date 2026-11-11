const CONSENT_KEY = "phc_provider_consent_v1";
const SHARING_KEY = "phc_provider_sharing_v1";
const ACCESS_LOG_KEY = "phc_provider_access_log_v1";

const defaultSharing = {
  heartRate: true,
  spo2: true,
  temperature: true,
  activity: true,
  sleep: true,
  risk: true,
  location: false,
  identity: false,
};

export function getProviderConsent() {
  return localStorage.getItem(CONSENT_KEY) === "true";
}

export function setProviderConsent(enabled) {
  localStorage.setItem(CONSENT_KEY, String(enabled));
}

export function getProviderSharing() {
  try {
    return {
      ...defaultSharing,
      ...JSON.parse(localStorage.getItem(SHARING_KEY) || "{}"),
    };
  } catch {
    return { ...defaultSharing };
  }
}

export function setProviderSharing(next) {
  localStorage.setItem(SHARING_KEY, JSON.stringify(next));
}

export function logProviderAccess(type, detail) {
  const current = getProviderAccessLog();
  current.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    detail,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem(ACCESS_LOG_KEY, JSON.stringify(current.slice(0, 30)));
}

export function getProviderAccessLog() {
  try {
    return JSON.parse(localStorage.getItem(ACCESS_LOG_KEY) || "[]");
  } catch {
    return [];
  }
}

function readStoredHealthData() {
  const possibleKeys = [
    "offline_health_readings",
    "offlineHealthReadings",
    "healthReadings",
    "wearable_readings",
  ];

  for (const key of possibleKeys) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      if (Array.isArray(value) && value.length) return value;
    } catch {
      // Ignore incompatible local storage entries.
    }
  }
  return [];
}

export function buildAnonymousSummary() {
  const readings = readStoredHealthData();
  const count = readings.length;
  const riskValues = readings
    .map((r) => Number(r.riskScore ?? r.riskProbability ?? r.risk ?? NaN))
    .filter(Number.isFinite);

  const avg = (field) => {
    const values = readings.map((r) => Number(r[field])).filter(Number.isFinite);
    return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10 : null;
  };

  const highRisk = riskValues.filter((v) => v >= 70).length;
  const moderateRisk = riskValues.filter((v) => v >= 40 && v < 70).length;

  return {
    sampleCount: count,
    averageHeartRate: avg("heartRate"),
    averageSpO2: avg("spo2"),
    averageTemperature: avg("bodyTemperature"),
    highRiskAlerts: highRisk,
    moderateRiskAlerts: moderateRisk,
    dataSource: count ? "Locally stored device readings" : "No local readings available",
  };
}

export function getProviderPayload() {
  const consent = getProviderConsent();
  const sharing = getProviderSharing();
  if (!consent) return { consent: false, sharing, identifiable: null };

  return {
    consent: true,
    sharing,
    identifiable: {
      enabled: sharing.identity,
      allowedMetrics: Object.entries(sharing)
        .filter(([key, enabled]) => enabled && key !== "identity")
        .map(([key]) => key),
      locationIncluded: sharing.location,
    },
  };
}
