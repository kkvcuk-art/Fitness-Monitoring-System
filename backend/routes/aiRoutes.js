const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

/* =========================================================
   RISK CALCULATION ENGINE
   ========================================================= */

function calculateDiseaseRisks(params) {
  const age = Number(params.age) || 35;
  const gender = params.gender || "Male";
  const heightCm = Number(params.heightCm) || 170;
  const weightKg = Number(params.weightKg) || 72;
  const computedBmi = Number((weightKg / ((heightCm / 100) * (heightCm / 100))).toFixed(1));
  const bmi = Number(params.bmi) || computedBmi || 24.9;

  const systolicBp = Number(params.systolicBp) || 120;
  const diastolicBp = Number(params.diastolicBp) || 80;
  const heartRate = Number(params.heartRate) || 72;
  const fastingGlucose = Number(params.fastingGlucose) || 95;
  const hba1c = Number(params.hba1c) || 5.4;
  const cholesterol = Number(params.cholesterol) || 190;
  
  // Hereditary Family Tree Inputs
  const fatherHistory = params.fatherHistory || "None";
  const motherHistory = params.motherHistory || "None";
  const paternalGrandfather = params.paternalGrandfather || "None";
  const paternalGrandmother = params.paternalGrandmother || "None";
  const maternalGrandfather = params.maternalGrandfather || "None";
  const maternalGrandmother = params.maternalGrandmother || "None";
  const siblingsHistory = params.siblingsHistory || "None";
  const previousHeartAttacks = params.previousHeartAttacks || "No";

  // Lifestyle & Work Habits
  const sleepDuration = Number(params.sleepHours || params.sleepDuration) || 7;
  const physicalActivity = Number(params.activityMinutes || params.physicalActivity) || 30;
  const dietPattern = params.dietPattern || "Balanced";
  const saltIntake = params.saltIntake || "Normal";
  const smokingStatus = params.smokingStatus || "Non-Smoker";
  const alcoholConsumption = params.alcoholConsumption || "None";
  const stressPower = Number(params.stressPower) || 4; // 1 to 10 scale
  const meditation = params.meditation || "No";

  let heartAttackScore = 12;
  let hypertensionScore = 12;
  let diabetesScore = 10;
  let strokeScore = 10;
  let hereditaryLoadScore = 15;
  let kidneyScore = 10;

  const justifications = [];
  const recommendations = [];

  // Age & Gender
  if (age >= 55) {
    heartAttackScore += 22;
    strokeScore += 20;
    hypertensionScore += 18;
    diabetesScore += 14;
    justifications.push(`Age over 55 (${age} yrs) significantly elevates vascular stiffness and coronary risk.`);
  } else if (age >= 45) {
    heartAttackScore += 12;
    hypertensionScore += 12;
    justifications.push(`Age over 45 (${age} yrs) increases baseline cardiovascular and metabolic risk.`);
  }

  if (gender === "Male" && age >= 45) {
    heartAttackScore += 8;
  }

  // BMI Obesity Factor
  if (bmi >= 30) {
    diabetesScore += 26;
    hypertensionScore += 22;
    heartAttackScore += 20;
    strokeScore += 18;
    justifications.push(`BMI of ${bmi} indicates Obesity, creating systemic metabolic inflammation.`);
    recommendations.push("Implement a 500-calorie daily deficit diet with clinical nutritionist support.");
  } else if (bmi >= 25) {
    diabetesScore += 12;
    hypertensionScore += 10;
    heartAttackScore += 10;
    justifications.push(`BMI of ${bmi} indicates overweight status.`);
  }

  // Blood Pressure (Systolic & Diastolic)
  if (systolicBp >= 140 || diastolicBp >= 90) {
    hypertensionScore += 40;
    strokeScore += 30;
    heartAttackScore += 25;
    kidneyScore += 20;
    justifications.push(`Stage-2 High BP (${systolicBp}/${diastolicBp} mmHg) exerts extreme tension on cardiac arteries.`);
    recommendations.push("Consult a Cardiologist for antihypertensive therapy & DASH low-sodium diet.");
  } else if (systolicBp >= 130 || diastolicBp >= 80) {
    hypertensionScore += 22;
    heartAttackScore += 14;
    strokeScore += 12;
    justifications.push(`Elevated Blood Pressure (${systolicBp}/${diastolicBp} mmHg) above normal 120/80 baseline.`);
  }

  // Fasting Blood Glucose & HbA1c
  if (fastingGlucose >= 126 || hba1c >= 6.5) {
    diabetesScore += 42;
    heartAttackScore += 18;
    kidneyScore += 22;
    justifications.push(`Fasting Glucose (${fastingGlucose} mg/dL) / HbA1c (${hba1c}%) meets Type-2 Diabetes threshold.`);
    recommendations.push("Order HbA1c & Oral Glucose Tolerance panel with Endocrinologist consult.");
  } else if (fastingGlucose >= 100 || hba1c >= 5.7) {
    diabetesScore += 22;
    justifications.push(`Fasting Glucose (${fastingGlucose} mg/dL) / HbA1c (${hba1c}%) indicates pre-diabetic state.`);
    recommendations.push("Reduce refined carbs and sugar intake to normalize fasting glucose.");
  }

  // Cholesterol & Heart Rate
  if (cholesterol >= 240) {
    heartAttackScore += 26;
    strokeScore += 18;
    justifications.push(`High Total Cholesterol (${cholesterol} mg/dL) accelerates arterial plaque buildup.`);
    recommendations.push("Request Lipid Sub-fraction panel (LDL/HDL/Triglycerides) and consider statin therapy evaluation.");
  } else if (cholesterol >= 200) {
    heartAttackScore += 12;
  }

  if (heartRate >= 90) {
    heartAttackScore += 10;
    hypertensionScore += 8;
    justifications.push(`Elevated resting Heart Rate (${heartRate} bpm) indicates sympathetic nervous tension.`);
  }

  // Multi-Generational Hereditary Family Tree Factors
  let hereditaryFactorsCount = 0;
  if (fatherHistory.toLowerCase().includes("heart") || fatherHistory.toLowerCase().includes("hypertension") || fatherHistory.toLowerCase().includes("diabetes")) {
    hereditaryLoadScore += 18;
    hereditaryFactorsCount++;
    if (fatherHistory.toLowerCase().includes("heart")) heartAttackScore += 20;
    if (fatherHistory.toLowerCase().includes("hypertension")) hypertensionScore += 15;
    if (fatherHistory.toLowerCase().includes("diabetes")) diabetesScore += 18;
  }

  if (motherHistory.toLowerCase().includes("heart") || motherHistory.toLowerCase().includes("hypertension") || motherHistory.toLowerCase().includes("diabetes")) {
    hereditaryLoadScore += 18;
    hereditaryFactorsCount++;
    if (motherHistory.toLowerCase().includes("heart")) heartAttackScore += 18;
    if (motherHistory.toLowerCase().includes("hypertension")) hypertensionScore += 15;
    if (motherHistory.toLowerCase().includes("diabetes")) diabetesScore += 20;
  }

  if (paternalGrandfather !== "None" || paternalGrandmother !== "None") {
    hereditaryLoadScore += 12;
    hereditaryFactorsCount++;
    heartAttackScore += 8;
    hypertensionScore += 8;
  }

  if (maternalGrandfather !== "None" || maternalGrandmother !== "None") {
    hereditaryLoadScore += 12;
    hereditaryFactorsCount++;
    diabetesScore += 10;
    strokeScore += 8;
  }

  if (previousHeartAttacks === "Yes" || previousHeartAttacks === true) {
    heartAttackScore += 30;
    strokeScore += 20;
    justifications.push("Personal / Direct Family history of previous Heart Attack (Myocardial Infarction) greatly increases recurring cardiac risk.");
    recommendations.push("Schedule an immediate 2D Echocardiogram, TMT Stress Test, and Coronary Angiogram consultation.");
  }

  if (hereditaryFactorsCount > 0) {
    justifications.push(`Multi-generational genetic markers confirmed across Father/Mother/Grandparents lineage.`);
  }

  // Lifestyle Habits (Smoking, Alcohol, Salt, Stress, Sleep, Meditation)
  if (smokingStatus === "Regular Smoker" || smokingStatus === "Heavy Smoker") {
    heartAttackScore += 25;
    strokeScore += 22;
    hypertensionScore += 16;
    justifications.push("Active tobacco smoking causes acute arterial constriction and endothelial oxidation.");
    recommendations.push("Join a smoking cessation counseling program and monitor arterial stiffness.");
  }

  if (alcoholConsumption === "Heavy") {
    hypertensionScore += 18;
    heartAttackScore += 12;
    justifications.push("Heavy alcohol intake increases systemic vascular resistance and cardiomyopathy risk.");
  }

  if (saltIntake === "High") {
    hypertensionScore += 15;
    strokeScore += 10;
    justifications.push("High dietary sodium intake promotes fluid retention and elevated systolic blood pressure.");
  }

  if (stressPower >= 7) {
    hypertensionScore += 14;
    heartAttackScore += 12;
    justifications.push(`High self-reported stress level (${stressPower}/10) triggers chronic cortisol & adrenaline surges.`);
    recommendations.push("Incorporate 20 minutes of daily mindfulness meditation or pranayama breathing.");
  }

  if (sleepDuration < 6) {
    diabetesScore += 10;
    hypertensionScore += 10;
    justifications.push(`Short sleep duration (${sleepDuration} hrs) impairs nocturnal blood pressure dipping.`);
  }

  if (meditation === "Yes") {
    hypertensionScore -= 5;
    heartAttackScore -= 5;
    stressPower <= 5;
  }

  // Cap helper (5% to 95%)
  const cap = (val) => Math.min(95, Math.max(5, Math.round(val)));

  const heartAttackRisk = cap(heartAttackScore);
  const hypertensionRisk = cap(hypertensionScore);
  const diabetesRisk = cap(diabetesScore);
  const strokeRisk = cap(strokeScore);
  const hereditaryLoadRisk = cap(hereditaryLoadScore);
  const kidneyRisk = cap(kidneyScore);

  // Composite AI Health Score (0 - 100, higher is better)
  const avgRisk = (heartAttackRisk + hypertensionRisk + diabetesRisk + strokeRisk + hereditaryLoadRisk) / 5;
  const compositeHealthScore = Math.max(10, Math.min(99, Math.round(100 - avgRisk * 0.85)));

  // Doctor Specialty Match
  let recommendedSpecialist = "General Physician";
  if (heartAttackRisk >= 40 || strokeRisk >= 40 || hypertensionRisk >= 50) recommendedSpecialist = "Cardiologist & Neurologist";
  else if (diabetesRisk >= 40) recommendedSpecialist = "Endocrinologist";
  else if (kidneyRisk >= 40) recommendedSpecialist = "Nephrologist";

  const getLevel = (r) => {
    if (r < 25) return "Low";
    if (r < 50) return "Moderate";
    if (r < 70) return "Elevated";
    return "High";
  };

  // Structured Disease Specific Cards Output
  const diseaseRiskCards = [
    {
      id: "heart_attack",
      name: "Heart Attack & Coronary Artery Disease Risk",
      icon: "🫀",
      risk: heartAttackRisk,
      level: getLevel(heartAttackRisk),
      horizon: heartAttackRisk > 50 ? "Estimated 3 to 5-Year Horizon" : "10-Year Long-Term Horizon",
      primaryDriver: previousHeartAttacks === "Yes" ? "Previous Family Cardiac History & BP" : `Systolic BP (${systolicBp} mmHg) & Cholesterol (${cholesterol} mg/dL)`,
      preventionKey: "Cardiology screening, lipid management, 150 mins/week aerobic exercise.",
    },
    {
      id: "hypertension",
      name: "Hypertension & Vascular Crisis Risk",
      icon: "🩺",
      risk: hypertensionRisk,
      level: getLevel(hypertensionRisk),
      horizon: hypertensionRisk > 50 ? "Active High Tension Hazard" : "5-Year Horizon",
      primaryDriver: `Blood Pressure (${systolicBp}/${diastolicBp} mmHg) & Salt/Stress Level`,
      preventionKey: "Low sodium DASH diet (<2g sodium/day), daily BP logging, stress management.",
    },
    {
      id: "diabetes",
      name: "Type-2 Diabetes Mellitus & Metabolic Risk",
      icon: "🩸",
      risk: diabetesRisk,
      level: getLevel(diabetesRisk),
      horizon: diabetesRisk > 50 ? "Immediate Metabolic Watch" : "5-Year Horizon",
      primaryDriver: `Fasting Glucose (${fastingGlucose} mg/dL) & BMI (${bmi})`,
      preventionKey: "HbA1c monitoring every 6 months, refined carbohydrate restriction.",
    },
    {
      id: "stroke",
      name: "Cerebrovascular Stroke & Clot Risk",
      icon: "🧠",
      risk: strokeRisk,
      level: getLevel(strokeRisk),
      horizon: strokeRisk > 50 ? "Vascular Caution Watch" : "10-Year Horizon",
      primaryDriver: `Systolic Tension (${systolicBp} mmHg) & Smoking/Age Profile`,
      preventionKey: "Carotid Doppler ultrasound screening, strict BP regulation.",
    },
    {
      id: "hereditary",
      name: "Multi-Generational Hereditary Genetic Load",
      icon: "🧬",
      risk: hereditaryLoadRisk,
      level: getLevel(hereditaryLoadRisk),
      horizon: "Pedigree Transmitted Baseline",
      primaryDriver: `Paternal (${fatherHistory}) & Maternal (${motherHistory}) History`,
      preventionKey: "Early annual screening starts 10 years earlier than baseline family onset.",
    },
  ];

  if (recommendations.length === 0) {
    recommendations.push("Maintain current balanced lifestyle, hydration, and schedule routine annual health panels.");
  }

  return {
    personName: params.fullName || params.name || "Target Profile",
    heartAttackRisk,
    hypertensionRisk,
    diabetesRisk,
    strokeRisk,
    hereditaryLoadRisk,
    kidneyRisk,
    compositeHealthScore,
    diseaseRiskCards,
    justifications,
    recommendations,
    recommendedSpecialist,
    disclaimer: "CRITICAL MEDICAL SAFETY DISCLAIMER (NFR-3.1): This AI risk evaluation is a preventive estimation tool and does NOT constitute formal medical diagnosis. Always consult certified healthcare specialists.",
  };
}

/* =========================================================
   POST /api/ai/predict-risk
   ========================================================= */

router.post("/predict-risk", authMiddleware.protect, (req, res) => {
  try {
    const riskAnalysis = calculateDiseaseRisks(req.body);
    return res.status(200).json({
      success: true,
      data: riskAnalysis,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to calculate disease risk scores.",
    });
  }
});

/* =========================================================
   POST /api/ai/simulate-twin (Digital Twin What-If)
   ========================================================= */

router.post("/simulate-twin", authMiddleware.protect, (req, res) => {
  try {
    const baseline = calculateDiseaseRisks(req.body.baseline || {});
    
    // Calculate simulated parameters
    const simulatedParams = {
      ...req.body.baseline,
      bmi: req.body.simulatedBmi || req.body.baseline?.bmi,
      sleepHours: req.body.simulatedSleepHours || req.body.baseline?.sleepHours,
      activityMinutes: req.body.simulatedActivityMinutes || req.body.baseline?.activityMinutes,
      fastingGlucose: req.body.simulatedFastingGlucose || req.body.baseline?.fastingGlucose,
      systolicBp: req.body.simulatedSystolicBp || req.body.baseline?.systolicBp,
    };

    const simulated = calculateDiseaseRisks(simulatedParams);

    const delta = {
      diabetesRiskChange: simulated.diabetesRisk - baseline.diabetesRisk,
      hypertensionRiskChange: simulated.hypertensionRisk - baseline.hypertensionRisk,
      cardiovascularRiskChange: simulated.cardiovascularRisk - baseline.cardiovascularRisk,
      kidneyRiskChange: simulated.kidneyRisk - baseline.kidneyRisk,
      healthScoreImprovement: simulated.compositeHealthScore - baseline.compositeHealthScore,
    };

    return res.status(200).json({
      success: true,
      baseline,
      simulated,
      delta,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to run Digital Twin simulation.",
    });
  }
});

module.exports = router;
module.exports.calculateDiseaseRisks = calculateDiseaseRisks;
