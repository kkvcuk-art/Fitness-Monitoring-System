// Normalized device abstraction for phones, smartwatches, fitness bands and healthcare wearables.
// It does not fabricate measurements: unsupported capabilities remain null.

export const DEVICE_PROFILES = {
  smartphone: {
    label: "Smartphone",
    capabilities: ["motion", "location"],
    transport: "browser-sensor",
  },
  smartwatch: {
    label: "Smartwatch",
    capabilities: ["heartRate", "spo2", "bodyTemperature", "motion"],
    transport: "bluetooth",
  },
  fitness_band: {
    label: "Fitness Band",
    capabilities: ["heartRate", "spo2", "motion", "activity", "sleep"],
    transport: "bluetooth",
  },
  healthcare_wearable: {
    label: "Healthcare Wearable",
    capabilities: ["heartRate", "spo2", "bodyTemperature", "motion", "activity"],
    transport: "bluetooth",
  },
};

export function normalizeDeviceReading(reading, deviceType = "smartphone") {
  const profile = DEVICE_PROFILES[deviceType] || DEVICE_PROFILES.smartphone;
  return {
    source: deviceType,
    sourceLabel: profile.label,
    transport: profile.transport,
    isSimulated: false,
    timestamp: reading.timestamp || new Date().toISOString(),
    heartRate: reading.heartRate ?? null,
    spo2: reading.spo2 ?? null,
    bodyTemperature: reading.bodyTemperature ?? null,
    activityMinutes: reading.activityMinutes ?? null,
    sleepHours: reading.sleepHours ?? null,
    motion: reading.motion ?? null,
    capabilities: profile.capabilities,
  };
}

export function getAvailableDeviceProfiles() {
  return Object.entries(DEVICE_PROFILES).map(([id, profile]) => ({ id, ...profile }));
}
