/**
 * Health Anomaly Intelligence Service
 *
 * Combines personal baseline deviation with
 * health-specific contextual rules.
 *
 * IMPORTANT:
 * These are early-warning signals only.
 * They are NOT medical diagnoses.
 */

function isValidNumber(value) {
  return value !== null &&
    value !== undefined &&
    !Number.isNaN(Number(value));
}

function calculateZScore(value, baseline) {
  if (
    !isValidNumber(value) ||
    !baseline ||
    !isValidNumber(baseline.average) ||
    !isValidNumber(baseline.standardDeviation) ||
    Number(baseline.standardDeviation) === 0
  ) {
    return null;
  }

  return (
    (Number(value) - Number(baseline.average)) /
    Number(baseline.standardDeviation)
  );
}

function addAlert(
  alerts,
  vitalType,
  severity,
  currentValue,
  message,
  factors = []
) {
  alerts.push({
    vitalType,
    severity,
    currentValue,
    message,
    factors,
  });
}

/**
 * Heart-rate analysis
 */
function analyzeHeartRate(reading, baseline, alerts) {
  if (!isValidNumber(reading?.heartRate)) {
    return;
  }

  const heartRate = Number(reading.heartRate);

  const zScore = calculateZScore(
    heartRate,
    baseline?.heartRate
  );

  const factors = [];

  if (heartRate >= 120) {
    factors.push("Heart rate is significantly elevated");

    addAlert(
      alerts,
      "heartRate",
      "critical",
      heartRate,
      "Heart rate is significantly elevated.",
      factors
    );

    return;
  }

  if (heartRate >= 100) {
    factors.push("Heart rate is above the configured contextual range");

    addAlert(
      alerts,
      "heartRate",
      "warning",
      heartRate,
      "Heart rate is elevated and should be monitored.",
      factors
    );

    return;
  }

  if (zScore !== null && Math.abs(zScore) >= 3) {
    factors.push(
      "Heart rate is substantially different from the personal baseline"
    );

    addAlert(
      alerts,
      "heartRate",
      "critical",
      heartRate,
      "Heart rate shows a substantial deviation from the personal baseline.",
      factors
    );

    return;
  }

  if (zScore !== null && Math.abs(zScore) >= 2) {
    factors.push(
      "Heart rate differs from the personal baseline"
    );

    addAlert(
      alerts,
      "heartRate",
      "warning",
      heartRate,
      "Heart rate differs noticeably from the personal baseline.",
      factors
    );
  }
}

/**
 * SpO₂ analysis
 */
function analyzeSpO2(reading, baseline, alerts) {
  if (!isValidNumber(reading?.spo2)) {
    return;
  }

  const spo2 = Number(reading.spo2);

  const zScore = calculateZScore(
    spo2,
    baseline?.spo2
  );

  if (spo2 < 90) {
    addAlert(
      alerts,
      "spo2",
      "critical",
      spo2,
      "SpO₂ is very low and requires immediate attention if confirmed.",
      ["SpO₂ is below 90%"]
    );

    return;
  }

  if (spo2 < 94) {
    addAlert(
      alerts,
      "spo2",
      "critical",
      spo2,
      "SpO₂ is below the configured critical threshold.",
      ["SpO₂ is below 94%"]
    );

    return;
  }

  if (spo2 < 96) {
    addAlert(
      alerts,
      "spo2",
      "warning",
      spo2,
      "SpO₂ is slightly below the configured contextual range.",
      ["SpO₂ is below 96%"]
    );

    return;
  }

  if (zScore !== null && zScore <= -3) {
    addAlert(
      alerts,
      "spo2",
      "critical",
      spo2,
      "SpO₂ shows a substantial decrease compared with the personal baseline.",
      ["Significant baseline deviation"]
    );

    return;
  }

  if (zScore !== null && zScore <= -2) {
    addAlert(
      alerts,
      "spo2",
      "warning",
      spo2,
      "SpO₂ is lower than the personal baseline.",
      ["Noticeable baseline deviation"]
    );
  }
}

/**
 * Body-temperature analysis
 */
function analyzeBodyTemperature(
  reading,
  baseline,
  alerts
) {
  if (!isValidNumber(reading?.bodyTemperature)) {
    return;
  }

  const temperature =
    Number(reading.bodyTemperature);

  const zScore = calculateZScore(
    temperature,
    baseline?.bodyTemperature
  );

  if (temperature >= 39) {
    addAlert(
      alerts,
      "bodyTemperature",
      "critical",
      temperature,
      "Body temperature is significantly elevated.",
      ["High body temperature"]
    );

    return;
  }

  if (temperature >= 38) {
    addAlert(
      alerts,
      "bodyTemperature",
      "warning",
      temperature,
      "Body temperature is elevated.",
      ["Elevated body temperature"]
    );

    return;
  }

  if (temperature <= 35) {
    addAlert(
      alerts,
      "bodyTemperature",
      "critical",
      temperature,
      "Body temperature is unusually low.",
      ["Low body temperature"]
    );

    return;
  }

  if (zScore !== null && Math.abs(zScore) >= 3) {
    addAlert(
      alerts,
      "bodyTemperature",
      "critical",
      temperature,
      "Body temperature shows a substantial deviation from the personal baseline.",
      ["Significant baseline deviation"]
    );

    return;
  }

  if (zScore !== null && Math.abs(zScore) >= 2) {
    addAlert(
      alerts,
      "bodyTemperature",
      "warning",
      temperature,
      "Body temperature differs noticeably from the personal baseline.",
      ["Noticeable baseline deviation"]
    );
  }
}

/**
 * Sleep / fatigue analysis
 */
function analyzeSleep(reading, baseline, alerts) {
  if (!isValidNumber(reading?.sleepHours)) {
    return;
  }

  const sleepHours =
    Number(reading.sleepHours);

  const zScore = calculateZScore(
    sleepHours,
    baseline?.sleepHours
  );

  if (sleepHours < 5) {
    addAlert(
      alerts,
      "sleepHours",
      "warning",
      sleepHours,
      "Sleep duration is substantially reduced.",
      ["Sleep duration below 5 hours"]
    );

    return;
  }

  if (zScore !== null && zScore <= -2) {
    addAlert(
      alerts,
      "sleepHours",
      "warning",
      sleepHours,
      "Sleep duration is lower than the personal baseline and may indicate fatigue context.",
      ["Reduced sleep compared with baseline"]
    );
  }
}

/**
 * Activity analysis
 */
function analyzeActivity(reading, baseline, alerts) {
  if (!isValidNumber(reading?.activityMinutes)) {
    return;
  }

  const activity =
    Number(reading.activityMinutes);

  const zScore = calculateZScore(
    activity,
    baseline?.activityMinutes
  );

  if (activity >= 180) {
    addAlert(
      alerts,
      "activityMinutes",
      "warning",
      activity,
      "Recent activity duration is unusually high.",
      ["High activity duration"]
    );

    return;
  }

  if (
    zScore !== null &&
    zScore <= -2 &&
    activity < 20
  ) {
    addAlert(
      alerts,
      "activityMinutes",
      "warning",
      activity,
      "Activity is substantially lower than the personal baseline.",
      ["Reduced activity compared with baseline"]
    );
  }
}

/**
 * Heat + heart-rate context
 */
function analyzeHeatStressContext(
  reading,
  alerts
) {
  const temperature =
    Number(reading?.environmentalTemperature);

  const humidity =
    Number(reading?.humidity);

  const heartRate =
    Number(reading?.heartRate);

  if (
    !isValidNumber(temperature) ||
    !isValidNumber(heartRate)
  ) {
    return;
  }

  let score = 0;
  const factors = [];

  if (temperature >= 35) {
    score += 3;
    factors.push("High environmental temperature");
  } else if (temperature >= 32) {
    score += 2;
    factors.push("Elevated environmental temperature");
  }

  if (isValidNumber(humidity)) {
    if (humidity >= 75) {
      score += 2;
      factors.push("High humidity");
    } else if (humidity >= 60) {
      score += 1;
      factors.push("Elevated humidity");
    }
  }

  if (heartRate >= 110) {
    score += 2;
    factors.push("Elevated heart rate");
  } else if (heartRate >= 100) {
    score += 1;
    factors.push("Heart rate above contextual range");
  }

  if (score >= 6) {
    addAlert(
      alerts,
      "heatStress",
      "critical",
      score,
      "Multiple heat and cardiovascular factors indicate elevated heat-stress context.",
      factors
    );

    return;
  }

  if (score >= 4) {
    addAlert(
      alerts,
      "heatStress",
      "warning",
      score,
      "Heat and cardiovascular conditions may increase heat-stress risk.",
      factors
    );
  }
}

/**
 * Respiratory environment + SpO₂ context
 */
function analyzeRespiratoryContext(
  reading,
  alerts
) {
  const aqi =
    Number(reading?.aqi);

  const spo2 =
    Number(reading?.spo2);

  if (
    !isValidNumber(aqi) ||
    !isValidNumber(spo2)
  ) {
    return;
  }

  let score = 0;
  const factors = [];

  if (aqi >= 151) {
    score += 3;
    factors.push("Very high AQI");
  } else if (aqi >= 101) {
    score += 2;
    factors.push("Elevated AQI");
  } else if (aqi >= 51) {
    score += 1;
    factors.push("Moderate AQI");
  }

  if (spo2 < 94) {
    score += 3;
    factors.push("Low SpO₂");
  } else if (spo2 < 96) {
    score += 1;
    factors.push("SpO₂ below contextual range");
  }

  if (score >= 6) {
    addAlert(
      alerts,
      "respiratoryContext",
      "critical",
      score,
      "Air-quality exposure and oxygen-level factors indicate elevated respiratory context.",
      factors
    );

    return;
  }

  if (score >= 4) {
    addAlert(
      alerts,
      "respiratoryContext",
      "warning",
      score,
      "Air-quality and oxygen-level conditions may require additional monitoring.",
      factors
    );
  }
}

/**
 * Combined health anomaly analysis
 */
function analyzeHealthAnomalies(
  reading,
  baseline
) {
  const alerts = [];

  analyzeHeartRate(
    reading,
    baseline,
    alerts
  );

  analyzeSpO2(
    reading,
    baseline,
    alerts
  );

  analyzeBodyTemperature(
    reading,
    baseline,
    alerts
  );

  analyzeSleep(
    reading,
    baseline,
    alerts
  );

  analyzeActivity(
    reading,
    baseline,
    alerts
  );

  analyzeHeatStressContext(
    reading,
    alerts
  );

  analyzeRespiratoryContext(
    reading,
    alerts
  );

  let overallSeverity = "normal";

  if (
    alerts.some(
      (alert) =>
        alert.severity === "critical"
    )
  ) {
    overallSeverity = "critical";
  } else if (
    alerts.some(
      (alert) =>
        alert.severity === "warning"
    )
  ) {
    overallSeverity = "warning";
  }

  return {
    overallSeverity,
    anomalyCount: alerts.length,
    alerts,
    analyzedAt: new Date(),
  };
}

function generateAnomalyReading(scenario) {
  const scenarios = {
    high_heart_rate: {
      heartRate: 125,
      spo2: 98,
      bodyTemperature: 36.8,
      activityMinutes: 70,
      sleepHours: 7.2,
      environmentalTemperature: 30,
      humidity: 55,
      aqi: 50,
    },

    low_spo2: {
      heartRate: 92,
      spo2: 91,
      bodyTemperature: 36.8,
      activityMinutes: 30,
      sleepHours: 7,
      environmentalTemperature: 28,
      humidity: 55,
      aqi: 70,
    },

    high_temperature: {
      heartRate: 98,
      spo2: 97,
      bodyTemperature: 38.5,
      activityMinutes: 35,
      sleepHours: 7,
      environmentalTemperature: 29,
      humidity: 55,
      aqi: 50,
    },

    heat_stress: {
      heartRate: 118,
      spo2: 96,
      bodyTemperature: 37.4,
      activityMinutes: 95,
      sleepHours: 6.8,
      environmentalTemperature: 36,
      humidity: 82,
      aqi: 70,
    },

    respiratory: {
      heartRate: 94,
      spo2: 92,
      bodyTemperature: 36.9,
      activityMinutes: 25,
      sleepHours: 7,
      environmentalTemperature: 29,
      humidity: 60,
      aqi: 170,
    },

    fatigue: {
      heartRate: 82,
      spo2: 97,
      bodyTemperature: 36.7,
      activityMinutes: 10,
      sleepHours: 4,
      environmentalTemperature: 28,
      humidity: 55,
      aqi: 45,
    },
  };

  const reading = scenarios[scenario];

  if (!reading) {
    throw new Error(
      "Invalid anomaly scenario."
    );
  }

  return {
    ...reading,

    source: "demo",

    isSimulated: true,

    recordedAt: new Date(),
  };
}

module.exports = {
  calculateZScore,
  analyzeHealthAnomalies,
  generateAnomalyReading,
};