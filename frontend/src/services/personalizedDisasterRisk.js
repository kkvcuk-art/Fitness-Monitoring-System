/**
 * Local personalized disaster-risk layer.
 * Combines an existing location hazard with the user's latest vital reading
 * and locally computed ML/Edge risk. No health data is transmitted by this module.
 * Prototype only; not a medical or evacuation authority.
 */

const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, n));

const level = (score) => {
  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MODERATE";
  return "LOW";
};

export function assessPersonalizedDisasterRisk({ alert = {}, reading = {}, mlRisk = null, edgeRisk = null } = {}) {
  const hazard = String(alert?.hazardType || alert?.type || "General").toLowerCase();
  const baseSeverity = String(alert?.severity || alert?.level || "").toLowerCase();

  const hr = Number(reading?.heartRate);
  const spo2 = Number(reading?.spo2);
  const bodyTemp = Number(reading?.bodyTemperature);
  const activity = Number(reading?.activityMinutes);
  const ml = Number(mlRisk?.riskPercent);
  const edge = Number(edgeRisk?.riskPercent);

  let score = baseSeverity.includes("critical") ? 55 : baseSeverity.includes("high") ? 40 : 20;
  const factors = [];
  const recommendations = [];

  const modelRisk = [ml, edge].filter(Number.isFinite).reduce((max, v) => Math.max(max, v), 0);
  score += modelRisk * 0.35;

  if (hazard.includes("heat")) {
    if (Number.isFinite(hr) && hr >= 110) { score += 15; factors.push("elevated heart rate during heat hazard"); }
    if (Number.isFinite(bodyTemp) && bodyTemp >= 37.8) { score += 15; factors.push("elevated body temperature"); }
    if (Number.isFinite(activity) && activity >= 60) { score += 10; factors.push("high activity exposure"); }
    recommendations.push("Reduce heat exposure, rest in a cool place, and maintain hydration.");
  }

  if (hazard.includes("air") || hazard.includes("pollution") || hazard.includes("smog")) {
    if (Number.isFinite(spo2) && spo2 < 94) { score += 20; factors.push("reduced SpO₂ during air-quality hazard"); }
    recommendations.push("Limit strenuous outdoor activity and move to cleaner indoor air when possible.");
  }

  if (hazard.includes("flood") || hazard.includes("cyclone") || hazard.includes("storm")) {
    if (Number.isFinite(hr) && hr >= 110) { score += 10; factors.push("elevated heart rate during disaster exposure"); }
    recommendations.push("Follow official evacuation instructions and use the nearest designated safe shelter.");
  }

  const personalizedScore = Math.round(clamp(score));
  const riskLevel = level(personalizedScore);

  if (riskLevel === "CRITICAL") recommendations.push("Use emergency assistance/SOS if you are in immediate danger or experiencing severe symptoms.");
  else if (riskLevel === "HIGH") recommendations.push("Treat this as a personalized early warning and reduce exposure to the hazard.");
  else if (riskLevel === "MODERATE") recommendations.push("Monitor your vital signs and the local hazard status closely.");
  else recommendations.push("No additional personalized escalation was detected from the available health signals.");

  return {
    available: Object.keys(reading || {}).length > 0,
    riskPercent: personalizedScore,
    level: riskLevel,
    hazard: alert?.hazardType || alert?.type || "General",
    modelRisk: Math.round(Number.isFinite(modelRisk) ? modelRisk : 0),
    factors: [...new Set(factors)],
    recommendations: [...new Set(recommendations)],
    inferenceLocation: "device",
    networkRequired: false,
    disclaimer: "Personalized disaster-risk prototype only; follow official emergency guidance and seek professional medical help for concerning symptoms.",
  };
}
