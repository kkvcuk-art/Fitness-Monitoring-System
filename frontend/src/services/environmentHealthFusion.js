/**
 * Local Environmental + Health Fusion Engine
 *
 * Combines the latest physiological reading, environmental conditions,
 * and local ML/Edge-AI risk scores into a single contextual warning.
 * This inference is local and does not transmit health data.
 *
 * Academic early-warning prototype; not a medical diagnostic system.
 */

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const levelFromScore = (score) => {
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MODERATE";
  return "LOW";
};

export function runEnvironmentalHealthFusion({
  reading = {},
  environment = null,
  mlRisk = null,
  edgeRisk = null,
} = {}) {
  if (!environment || !reading) {
    return { available: false };
  }

  const temperature = Number(environment?.weather?.temperature);
  const humidity = Number(environment?.weather?.humidity);
  const apparentTemperature = Number(environment?.weather?.apparentTemperature);
  const aqi = Number(environment?.airQuality?.aqi);
  const pm25 = Number(environment?.airQuality?.pm2_5);
  const heartRate = Number(reading?.heartRate);
  const spo2 = Number(reading?.spo2);
  const bodyTemperature = Number(reading?.bodyTemperature);
  const activityMinutes = Number(reading?.activityMinutes);

  const factors = [];
  const recommendations = [];
  let environmentalScore = 0;

  // Heat/disaster context.
  if (Number.isFinite(temperature) && temperature >= 35) {
    environmentalScore += 25;
    factors.push("extreme ambient heat");
    recommendations.push("Reduce prolonged outdoor exposure and seek a cooler environment.");
  } else if (Number.isFinite(temperature) && temperature >= 32) {
    environmentalScore += 15;
    factors.push("elevated ambient heat");
  }

  if (Number.isFinite(apparentTemperature) && apparentTemperature >= 40) {
    environmentalScore += 20;
    factors.push("very high apparent temperature");
  }

  if (Number.isFinite(humidity) && humidity >= 75) {
    environmentalScore += 10;
    factors.push("high humidity");
  }

  if (Number.isFinite(heartRate) && heartRate >= 110) {
    environmentalScore += 15;
    factors.push("elevated heart rate during environmental stress");
  }

  if (Number.isFinite(activityMinutes) && activityMinutes >= 60 && environmentalScore >= 25) {
    environmentalScore += 10;
    factors.push("higher activity during heat exposure");
    recommendations.push("Take rest breaks and maintain hydration during activity.");
  }

  // Pollution/respiratory context.
  if (Number.isFinite(aqi) && aqi > 150) {
    environmentalScore += 25;
    factors.push("unhealthy air quality");
    recommendations.push("Limit strenuous outdoor activity while air quality is poor.");
  } else if (Number.isFinite(aqi) && aqi > 100) {
    environmentalScore += 15;
    factors.push("elevated air pollution");
  }

  if (Number.isFinite(pm25) && pm25 > 35) {
    environmentalScore += 10;
    factors.push("elevated PM2.5");
  }

  if (Number.isFinite(spo2) && spo2 < 94 && Number.isFinite(aqi) && aqi > 100) {
    environmentalScore += 20;
    factors.push("reduced SpO₂ with elevated air pollution");
    recommendations.push("Move to cleaner indoor air and consider medical advice if symptoms persist or worsen.");
  }

  if (Number.isFinite(bodyTemperature) && bodyTemperature > 37.5 && environmentalScore >= 25) {
    environmentalScore += 10;
    factors.push("elevated body temperature during environmental stress");
  }

  const modelScores = [mlRisk?.riskPercent, edgeRisk?.riskPercent]
    .filter((value) => Number.isFinite(Number(value)))
    .map(Number);

  const modelRisk = modelScores.length
    ? Math.max(...modelScores)
    : 0;

  // Environmental conditions can raise the contextual score, but cannot erase a high ML signal.
  const fusedRisk = Math.round(clamp(modelRisk * 0.65 + environmentalScore * 0.35, 0, 100));
  const level = levelFromScore(fusedRisk);

  if (level === "HIGH") {
    recommendations.push("Treat this as an early-warning signal and reduce exposure to the identified environmental hazard.");
  } else if (level === "MODERATE") {
    recommendations.push("Monitor your vital signs and environmental conditions more closely.");
  } else if (!recommendations.length) {
    recommendations.push("Current physiological and environmental signals do not show an elevated contextual risk.");
  }

  return {
    available: true,
    riskPercent: fusedRisk,
    level,
    environmentalScore: Math.round(clamp(environmentalScore, 0, 100)),
    modelRisk,
    factors: [...new Set(factors)],
    recommendations: [...new Set(recommendations)],
    context: {
      heatwaveSensitive: Number.isFinite(temperature) && temperature >= 35,
      airPollutionSensitive: Number.isFinite(aqi) && aqi > 100,
      respiratoryConcern: Number.isFinite(spo2) && spo2 < 94 && Number.isFinite(aqi) && aqi > 100,
    },
    inferenceLocation: "device",
    networkRequired: false,
    disclaimer: "Contextual early-warning prototype only; it does not diagnose medical conditions.",
  };
}
