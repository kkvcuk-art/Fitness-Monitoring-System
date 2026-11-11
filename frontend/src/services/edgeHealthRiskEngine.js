/**
 * Privacy-preserving Edge Health Risk Engine
 *
 * This module performs lightweight inference locally in the browser.
 * No health values are sent to a server by this function.
 *
 * IMPORTANT:
 * - This is an academic/prototype early-warning model, not a medical
 *   diagnostic system.
 * - The weights are intentionally simple and interpretable so the
 *   inference path can be demonstrated without a cloud ML service.
 */

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalize = (value, min, max) =>
  clamp((Number(value) - min) / (max - min), 0, 1);

const sigmoid = (value) => 1 / (1 + Math.exp(-value));

export function runEdgeHealthRiskInference(reading = {}) {
  const heartRate = Number(reading.heartRate);
  const spo2 = Number(reading.spo2);
  const bodyTemperature = Number(reading.bodyTemperature);
  const activityMinutes = Number(reading.activityMinutes);
  const sleepHours = Number(reading.sleepHours);
  const humidity = Number(reading.humidity);
  const environmentalTemperature = Number(
    reading.environmentalTemperature,
  );
  const aqi = Number(reading.aqi);

  const features = {
    elevatedHeartRate: Number.isFinite(heartRate)
      ? normalize(heartRate, 60, 130)
      : 0,
    lowSpO2: Number.isFinite(spo2)
      ? normalize(96 - spo2, 0, 10)
      : 0,
    elevatedBodyTemperature: Number.isFinite(bodyTemperature)
      ? normalize(bodyTemperature, 37, 40)
      : 0,
    lowActivity: Number.isFinite(activityMinutes)
      ? normalize(30 - activityMinutes, 0, 30)
      : 0,
    reducedSleep: Number.isFinite(sleepHours)
      ? normalize(7 - sleepHours, 0, 5)
      : 0,
    heatExposure:
      Number.isFinite(environmentalTemperature) && Number.isFinite(humidity)
        ? clamp(
            normalize(environmentalTemperature, 30, 45) * 0.6 +
              normalize(humidity, 50, 100) * 0.4,
            0,
            1,
          )
        : 0,
    airQualityRisk: Number.isFinite(aqi)
      ? normalize(aqi, 50, 300)
      : 0,
  };

  // Interpretable local model weights for prototype inference.
  const weightedSignal =
    features.elevatedHeartRate * 1.4 +
    features.lowSpO2 * 2.4 +
    features.elevatedBodyTemperature * 1.8 +
    features.lowActivity * 0.5 +
    features.reducedSleep * 0.6 +
    features.heatExposure * 1.3 +
    features.airQualityRisk * 0.8;

  const probability = sigmoid(weightedSignal - 2.1);
  const riskPercent = Math.round(probability * 100);

  let level = "LOW";
  if (riskPercent >= 70) level = "HIGH";
  else if (riskPercent >= 40) level = "MODERATE";

  const factors = [];

  if (features.elevatedHeartRate >= 0.5) {
    factors.push("elevated heart rate");
  }
  if (features.lowSpO2 >= 0.25) {
    factors.push("reduced SpO₂");
  }
  if (features.elevatedBodyTemperature >= 0.35) {
    factors.push("elevated body temperature");
  }
  if (features.reducedSleep >= 0.4) {
    factors.push("reduced sleep");
  }
  if (features.heatExposure >= 0.55) {
    factors.push("heat/humidity exposure");
  }
  if (features.airQualityRisk >= 0.5) {
    factors.push("poor air quality");
  }

  return {
    model: "Edge Health Risk Prototype v1",
    inferenceLocation: "device",
    networkRequired: false,
    riskPercent,
    level,
    factors,
    features,
    disclaimer:
      "Early-warning prototype only. It does not diagnose medical conditions or replace professional medical advice.",
  };
}
