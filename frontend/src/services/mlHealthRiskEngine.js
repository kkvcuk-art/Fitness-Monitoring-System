import model from "./mlHealthRiskModel.json" with { type: "json" };

const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const finite = (value) => Number.isFinite(Number(value));

export function runMLHealthRiskInference(reading = {}) {
  const values = model.features.map((name) => Number(reading[name]));
  const available = values.map((value) => Number.isFinite(value));

  if (!available.some(Boolean)) {
    return {
      available: false,
      model: `Local ML Health Risk Model v${model.version}`,
      inferenceLocation: "device",
      networkRequired: false,
      disclaimer: "Academic early-warning prototype; not a medical diagnostic model.",
    };
  }

  // Missing sensor values are replaced by the model's training mean so that
  // the model can still run locally when a wearable exposes only some fields.
  const standardized = values.map((value, index) => {
    const safeValue = finite(value) ? value : model.scaler.mean[index];
    return (safeValue - model.scaler.mean[index]) / model.scaler.scale[index];
  });

  let linear = model.classifier.bias;
  standardized.forEach((value, index) => {
    linear += value * model.classifier.weights[index];
  });

  const probability = sigmoid(linear);
  const riskPercent = Math.round(probability * 100);
  const level = riskPercent >= 70 ? "HIGH" : riskPercent >= 40 ? "MODERATE" : "LOW";

  const factors = [];
  if (finite(reading.heartRate) && Number(reading.heartRate) > 100) factors.push("elevated heart rate");
  if (finite(reading.spo2) && Number(reading.spo2) < 94) factors.push("reduced SpO₂");
  if (finite(reading.bodyTemperature) && Number(reading.bodyTemperature) > 37.5) factors.push("elevated body temperature");
  if (finite(reading.activityMinutes) && Number(reading.activityMinutes) < 25) factors.push("low activity");
  if (finite(reading.sleepHours) && Number(reading.sleepHours) < 6) factors.push("reduced sleep");
  if (finite(reading.environmentalTemperature) && Number(reading.environmentalTemperature) > 32) factors.push("heat exposure");
  if (finite(reading.humidity) && Number(reading.humidity) > 75) factors.push("high humidity");
  if (finite(reading.aqi) && Number(reading.aqi) > 100) factors.push("poor air quality");

  return {
    available: true,
    model: `Local ML Health Risk Model v${model.version}`,
    inferenceLocation: "device",
    networkRequired: false,
    riskPercent,
    level,
    probability,
    factors,
    missingFeatures: model.features.filter((_, i) => !available[i]),
    trainingNote: model.training.note,
    disclaimer: "Academic early-warning prototype; not a medical diagnostic model. Model is trained on synthetic demonstration data.",
  };
}
