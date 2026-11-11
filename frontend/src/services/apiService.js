const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";


// ============================================================
// Generic API Request
// ============================================================

export async function apiRequest(endpoint, options = {}) {
  const {
    method = "GET",
    body,
    token,
    headers = {},
  } = options;

  const requestHeaders = {
    ...headers,
  };

  if (body !== undefined) {
    requestHeaders["Content-Type"] =
      "application/json";
  }

  if (token) {
    requestHeaders.Authorization =
      `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      method,
      headers: requestHeaders,
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
    },
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`,
    );
  }

  return data;
}


// ============================================================
// DASHBOARD
// ============================================================

export async function getDashboardData(
  token,
) {
  const [
    membersResponse,
    reportsResponse,
    vaccinationsResponse,
  ] = await Promise.all([
    getMembers(token),
    getMedicalReports(token),
    getVaccinations(token),
  ]);

  return {
    members:
      membersResponse?.members ||
      membersResponse?.data ||
      membersResponse ||
      [],

    reports:
      reportsResponse?.reports ||
      reportsResponse?.data ||
      reportsResponse ||
      [],

    vaccinations:
      vaccinationsResponse?.vaccinations ||
      vaccinationsResponse?.data ||
      vaccinationsResponse ||
      [],
  };
}


// ============================================================
// AUTHENTICATION
// ============================================================

export async function loginUser(
  email,
  password,
) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: {
      email,
      password,
    },
  });
}

export async function registerUser(
  userData,
) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: userData,
  });
}


// ============================================================
// FAMILY MEMBERS
// ============================================================

export async function getMembers(
  token,
) {
  return apiRequest("/members", {
    method: "GET",
    token,
  });
}

export async function getMemberById(
  token,
  memberId,
) {
  return apiRequest(
    `/members/${memberId}`,
    {
      method: "GET",
      token,
    },
  );
}

export async function createMember(
  token,
  memberData,
) {
  return apiRequest("/members", {
    method: "POST",
    token,
    body: memberData,
  });
}

export async function updateMember(
  token,
  memberId,
  memberData,
) {
  return apiRequest(
    `/members/${memberId}`,
    {
      method: "PUT",
      token,
      body: memberData,
    },
  );
}

export async function deleteMember(
  token,
  memberId,
) {
  return apiRequest(
    `/members/${memberId}`,
    {
      method: "DELETE",
      token,
    },
  );
}


// ============================================================
// RELATIONSHIPS
// ============================================================

export async function getRelationships(
  token,
) {
  return apiRequest(
    "/relationships",
    {
      method: "GET",
      token,
    },
  );
}

export async function createRelationship(
  token,
  relationshipData,
) {
  return apiRequest(
    "/relationships",
    {
      method: "POST",
      token,
      body: relationshipData,
    },
  );
}

export async function updateRelationship(
  token,
  relationshipId,
  relationshipData,
) {
  return apiRequest(
    `/relationships/${relationshipId}`,
    {
      method: "PUT",
      token,
      body: relationshipData,
    },
  );
}

export async function deleteRelationship(
  token,
  relationshipId,
) {
  return apiRequest(
    `/relationships/${relationshipId}`,
    {
      method: "DELETE",
      token,
    },
  );
}


// ============================================================
// VACCINATIONS
// ============================================================

export async function getVaccinations(
  token,
  memberId,
) {
  const endpoint = memberId
    ? `/vaccinations/${memberId}`
    : "/vaccinations";

  return apiRequest(endpoint, {
    method: "GET",
    token,
  });
}

export async function createVaccination(
  token,
  vaccinationData,
) {
  return apiRequest(
    "/vaccinations",
    {
      method: "POST",
      token,
      body: vaccinationData,
    },
  );
}

export async function updateVaccination(
  token,
  vaccinationId,
  vaccinationData,
) {
  return apiRequest(
    `/vaccinations/${vaccinationId}`,
    {
      method: "PUT",
      token,
      body: vaccinationData,
    },
  );
}

export async function deleteVaccination(
  token,
  vaccinationId,
) {
  return apiRequest(
    `/vaccinations/${vaccinationId}`,
    {
      method: "DELETE",
      token,
    },
  );
}


// ============================================================
// MEDICAL REPORTS
// ============================================================

export async function getMedicalReports(
  token,
  memberId,
) {
  const endpoint = memberId
    ? `/medical-reports/${memberId}`
    : "/medical-reports";

  return apiRequest(endpoint, {
    method: "GET",
    token,
  });
}

export async function createMedicalReport(
  token,
  reportData,
) {
  return apiRequest(
    "/medical-reports",
    {
      method: "POST",
      token,
      body: reportData,
    },
  );
}

export async function updateMedicalReport(
  token,
  reportId,
  reportData,
) {
  return apiRequest(
    `/medical-reports/${reportId}`,
    {
      method: "PUT",
      token,
      body: reportData,
    },
  );
}

export async function deleteMedicalReport(
  token,
  reportId,
) {
  return apiRequest(
    `/medical-reports/${reportId}`,
    {
      method: "DELETE",
      token,
    },
  );
}


// ============================================================
// AI RISK PREDICTION
// ============================================================

export async function predictAIRisk(
  token,
  predictionData,
) {
  return apiRequest(
    "/ai/predict",
    {
      method: "POST",
      token,
      body: predictionData,
    },
  );
}


// ============================================================
// DIGITAL TWIN
// ============================================================

export async function simulateDigitalTwin(
  token,
  simulationData,
) {
  return apiRequest(
    "/ai/simulate-twin",
    {
      method: "POST",
      token,
      body: simulationData,
    },
  );
}


// ============================================================
// SMART REMINDERS
// ============================================================

export async function getSmartReminders(
  token,
) {
  return apiRequest(
    "/reminders",
    {
      method: "GET",
      token,
    },
  );
}

export async function createSmartReminder(
  token,
  reminderData,
) {
  return apiRequest(
    "/reminders",
    {
      method: "POST",
      token,
      body: reminderData,
    },
  );
}

export async function toggleSmartReminder(
  token,
  reminderId,
  completed,
) {
  return apiRequest(
    `/reminders/${reminderId}`,
    {
      method: "PUT",
      token,
      body: {
        completed,
      },
    },
  );
}

export async function deleteSmartReminder(
  token,
  reminderId,
) {
  return apiRequest(
    `/reminders/${reminderId}`,
    {
      method: "DELETE",
      token,
    },
  );
}


// ============================================================
// HEALTH HISTORY
// ============================================================

export async function getHealthHistory(
  token,
  memberId,
) {
  return apiRequest(
    `/health-history/${memberId}`,
    {
      method: "GET",
      token,
    },
  );
}


// ============================================================
// DISASTER ALERTS
// ============================================================

export async function getDisasterAlerts(
  token,
) {
  return apiRequest(
    "/disaster/alerts",
    {
      method: "GET",
      token,
    },
  );
}

export async function broadcastDisasterAlert(
  token,
  alertData,
) {
  return apiRequest(
    "/disaster/broadcast",
    {
      method: "POST",
      token,
      body: alertData,
    },
  );
}


// ============================================================
// VITAL READINGS
// ============================================================

export async function createVitalReading(
  token,
  readingData,
) {
  return apiRequest(
    "/vitals/readings",
    {
      method: "POST",
      token,
      body: readingData,
    },
  );
}

export async function getVitalReadings(
  token,
  memberId,
  limit = 20,
) {
  const query = limit
    ? `?limit=${limit}`
    : "";

  return apiRequest(
    `/vitals/readings/${memberId}${query}`,
    {
      method: "GET",
      token,
    },
  );
}

export async function getLatestVitalReading(
  token,
  memberId,
) {
  return apiRequest(
    `/vitals/latest/${memberId}`,
    {
      method: "GET",
      token,
    },
  );
}

export async function deleteDemoVitalReadings(
  token,
) {
  return apiRequest(
    "/vitals/readings/demo",
    {
      method: "DELETE",
      token,
    },
  );
}


// ============================================================
// DEMO VITAL READING
// ============================================================

export function generateDemoVitalReading() {
  return {
    heartRate: Math.floor(
      68 + Math.random() * 25,
    ),

    spo2: Number(
      (96 + Math.random() * 3).toFixed(1),
    ),

    bodyTemperature: Number(
      (36.4 + Math.random() * 0.9).toFixed(1),
    ),

    activityMinutes: Math.floor(
      20 + Math.random() * 60,
    ),

    sleepHours: Number(
      (6 + Math.random() * 2.4).toFixed(1),
    ),

    environmentalTemperature: Number(
      (27 + Math.random() * 9).toFixed(1),
    ),

    humidity: Math.floor(
      45 + Math.random() * 35,
    ),

    aqi: Math.floor(
      40 + Math.random() * 100,
    ),

    source: "demo",

    isSimulated: true,
  };
}

export async function createDemoVitalReading(
  token,
  memberId,
) {
  const reading =
    generateDemoVitalReading();

  return createVitalReading(token, {
    memberId,
    ...reading,
  });
}


// ============================================================
// PERSONAL HEALTH BASELINE
// ============================================================

export async function calculatePersonalBaseline(
  token,
  memberId,
) {
  return apiRequest(
    `/baseline/${memberId}/calculate`,
    {
      method: "POST",
      token,
    },
  );
}

export async function getPersonalBaseline(
  token,
  memberId,
) {
  return apiRequest(
    `/baseline/${memberId}`,
    {
      method: "GET",
      token,
    },
  );
}


// ============================================================
// BACKEND HEALTH CHECK
// ============================================================

export async function checkBackendHealth() {
  return apiRequest(
    "/health",
    {
      method: "GET",
    },
  );
}

export async function analyzeVitalAnomalies(token, memberId) {
  return apiRequest(`/anomalies/${memberId}/analyze`, {
    method: "POST",
    token,
  });
}

export async function getAnomalyHistory(token, memberId) {
  return apiRequest(`/anomalies/${memberId}`, {
    method: "GET",
    token,
  });
}

export async function getEnvironmentalData(
  token,
  latitude,
  longitude
) {
  return apiRequest(
    `/environment/current?latitude=${encodeURIComponent(
      latitude
    )}&longitude=${encodeURIComponent(longitude)}`,
    {
      method: "GET",
      token,
    }
  );
}

export async function analyzeEnvironmentalRisks(
  token,
  memberId,
  environment
) {
  return apiRequest(
    `/environment-risk/${memberId}/analyze`,
    {
      method: "POST",
      token,
      body: {
        environment,
      },
    }
  );
}

/**
 * Create a controlled simulated health anomaly.
 *
 * Supported scenarios:
 * high_heart_rate
 * low_spo2
 * high_temperature
 * heat_stress
 * respiratory
 * fatigue
 */
export async function simulateHealthAnomaly(
  token,
  memberId,
  scenario
) {
  return apiRequest(
    `/anomalies/${memberId}/simulate`,
    {
      method: "POST",
      token,
      body: {
        scenario,
      },
    }
  );
}