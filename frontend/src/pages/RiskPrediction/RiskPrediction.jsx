import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import {
  predictAIRisk,
  getMembers,
} from "../../services/apiService";
import "./RiskPrediction.css";

function calculateAgeFromDob(dob) {
  if (!dob) return 35;
  const birth = new Date(dob);
  const diff = Date.now() - birth.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970) || 35;
}

function computeRiskLocally(form, personName) {
  const age = Number(form.age) || 35;
  const gender = form.gender || "Male";
  const heightCm = Number(form.heightCm) || 170;
  const weightKg = Number(form.weightKg) || 72;
  const computedBmi = Number((weightKg / ((heightCm / 100) * (heightCm / 100))).toFixed(1));
  const bmi = Number(form.bmi) || computedBmi || 24.9;

  const systolicBp = Number(form.systolicBp) || 120;
  const diastolicBp = Number(form.diastolicBp) || 80;
  const heartRate = Number(form.heartRate) || 72;
  const fastingGlucose = Number(form.fastingGlucose) || 95;
  const hba1c = Number(form.hba1c) || 5.4;
  const cholesterol = Number(form.cholesterol) || 190;
  
  // Hereditary Family Tree Inputs
  const fatherHistory = form.fatherHistory || "None";
  const motherHistory = form.motherHistory || "None";
  const paternalGrandfather = form.paternalGrandfather || "None";
  const paternalGrandmother = form.paternalGrandmother || "None";
  const maternalGrandfather = form.maternalGrandfather || "None";
  const maternalGrandmother = form.maternalGrandmother || "None";
  const siblingsHistory = form.siblingsHistory || "None";
  const previousHeartAttacks = form.previousHeartAttacks || "No";

  // Lifestyle & Work Habits
  const sleepDuration = Number(form.sleepHours) || 7;
  const physicalActivity = Number(form.activityMinutes) || 30;
  const dietPattern = form.dietPattern || "Balanced";
  const saltIntake = form.saltIntake || "Normal";
  const smokingStatus = form.smokingStatus || "Non-Smoker";
  const alcoholConsumption = form.alcoholConsumption || "None";
  const stressPower = Number(form.stressPower) || 4;
  const meditation = form.meditation || "No";

  let heartAttackScore = 12;
  let hypertensionScore = 12;
  let diabetesScore = 10;
  let strokeScore = 10;
  let hereditaryLoadScore = 15;
  let kidneyScore = 10;

  const justifications = [];
  const recommendations = [];

  if (age >= 55) {
    heartAttackScore += 22; strokeScore += 20; hypertensionScore += 18; diabetesScore += 14;
    justifications.push(`Age over 55 (${age} yrs) significantly elevates vascular stiffness and coronary risk.`);
  } else if (age >= 45) {
    heartAttackScore += 12; hypertensionScore += 12;
    justifications.push(`Age over 45 (${age} yrs) increases baseline cardiovascular and metabolic risk.`);
  }

  if (gender === "Male" && age >= 45) heartAttackScore += 8;

  if (bmi >= 30) {
    diabetesScore += 26; hypertensionScore += 22; heartAttackScore += 20; strokeScore += 18;
    justifications.push(`BMI of ${bmi} indicates Obesity, creating systemic metabolic inflammation.`);
    recommendations.push("Implement a 500-calorie daily deficit diet with clinical nutritionist support.");
  } else if (bmi >= 25) {
    diabetesScore += 12; hypertensionScore += 10; heartAttackScore += 10;
    justifications.push(`BMI of ${bmi} indicates overweight status.`);
  }

  if (systolicBp >= 140 || diastolicBp >= 90) {
    hypertensionScore += 40; strokeScore += 30; heartAttackScore += 25; kidneyScore += 20;
    justifications.push(`Stage-2 High BP (${systolicBp}/${diastolicBp} mmHg) exerts extreme tension on cardiac arteries.`);
    recommendations.push("Consult a Cardiologist for antihypertensive therapy & DASH low-sodium diet.");
  } else if (systolicBp >= 130 || diastolicBp >= 80) {
    hypertensionScore += 22; heartAttackScore += 14; strokeScore += 12;
    justifications.push(`Elevated Blood Pressure (${systolicBp}/${diastolicBp} mmHg) above normal 120/80 baseline.`);
  }

  if (fastingGlucose >= 126 || hba1c >= 6.5) {
    diabetesScore += 42; heartAttackScore += 18; kidneyScore += 22;
    justifications.push(`Fasting Glucose (${fastingGlucose} mg/dL) / HbA1c (${hba1c}%) meets Type-2 Diabetes threshold.`);
    recommendations.push("Order HbA1c & Oral Glucose Tolerance panel with Endocrinologist consult.");
  } else if (fastingGlucose >= 100 || hba1c >= 5.7) {
    diabetesScore += 22;
    justifications.push(`Fasting Glucose (${fastingGlucose} mg/dL) / HbA1c (${hba1c}%) indicates pre-diabetic state.`);
    recommendations.push("Reduce refined carbs and sugar intake to normalize fasting glucose.");
  }

  if (cholesterol >= 240) {
    heartAttackScore += 26; strokeScore += 18;
    justifications.push(`High Total Cholesterol (${cholesterol} mg/dL) accelerates arterial plaque buildup.`);
    recommendations.push("Request Lipid Sub-fraction panel (LDL/HDL/Triglycerides) and consider statin therapy evaluation.");
  } else if (cholesterol >= 200) {
    heartAttackScore += 12;
  }

  if (heartRate >= 90) {
    heartAttackScore += 10; hypertensionScore += 8;
    justifications.push(`Elevated resting Heart Rate (${heartRate} bpm) indicates sympathetic nervous tension.`);
  }

  let hereditaryFactorsCount = 0;
  if (fatherHistory !== "None") {
    hereditaryLoadScore += 18; hereditaryFactorsCount++;
    if (fatherHistory.includes("Heart")) heartAttackScore += 20;
    if (fatherHistory.includes("Hypertension")) hypertensionScore += 15;
    if (fatherHistory.includes("Diabetes")) diabetesScore += 18;
  }

  if (motherHistory !== "None") {
    hereditaryLoadScore += 18; hereditaryFactorsCount++;
    if (motherHistory.includes("Heart")) heartAttackScore += 18;
    if (motherHistory.includes("Hypertension")) hypertensionScore += 15;
    if (motherHistory.includes("Diabetes")) diabetesScore += 20;
  }

  if (paternalGrandfather !== "None" || paternalGrandmother !== "None") {
    hereditaryLoadScore += 12; hereditaryFactorsCount++; heartAttackScore += 8; hypertensionScore += 8;
  }

  if (maternalGrandfather !== "None" || maternalGrandmother !== "None") {
    hereditaryLoadScore += 12; hereditaryFactorsCount++; diabetesScore += 10; strokeScore += 8;
  }

  if (previousHeartAttacks === "Yes") {
    heartAttackScore += 30; strokeScore += 20;
    justifications.push("Personal / Direct Family history of previous Heart Attack (Myocardial Infarction) greatly increases recurring cardiac risk.");
    recommendations.push("Schedule an immediate 2D Echocardiogram, TMT Stress Test, and Coronary Angiogram consultation.");
  }

  if (hereditaryFactorsCount > 0) {
    justifications.push("Multi-generational genetic markers confirmed across Father/Mother/Grandparents lineage.");
  }

  if (smokingStatus.includes("Smoker")) {
    heartAttackScore += 25; strokeScore += 22; hypertensionScore += 16;
    justifications.push("Active tobacco smoking causes acute arterial constriction and endothelial oxidation.");
    recommendations.push("Join a smoking cessation counseling program and monitor arterial stiffness.");
  }

  if (alcoholConsumption === "Heavy") {
    hypertensionScore += 18; heartAttackScore += 12;
    justifications.push("Heavy alcohol intake increases systemic vascular resistance and cardiomyopathy risk.");
  }

  if (saltIntake === "High") {
    hypertensionScore += 15; strokeScore += 10;
    justifications.push("High dietary sodium intake promotes fluid retention and elevated systolic blood pressure.");
  }

  if (stressPower >= 7) {
    hypertensionScore += 14; heartAttackScore += 12;
    justifications.push(`High self-reported stress level (${stressPower}/10) triggers chronic cortisol & adrenaline surges.`);
    recommendations.push("Incorporate 20 minutes of daily mindfulness meditation or pranayama breathing.");
  }

  if (sleepDuration < 6) {
    diabetesScore += 10; hypertensionScore += 10;
    justifications.push(`Short sleep duration (${sleepDuration} hrs) impairs nocturnal blood pressure dipping.`);
  }

  if (meditation === "Yes") {
    hypertensionScore -= 5; heartAttackScore -= 5;
  }

  const cap = (val) => Math.min(95, Math.max(5, Math.round(val)));

  const heartAttackRisk = cap(heartAttackScore);
  const hypertensionRisk = cap(hypertensionScore);
  const diabetesRisk = cap(diabetesScore);
  const strokeRisk = cap(strokeScore);
  const hereditaryLoadRisk = cap(hereditaryLoadScore);
  const kidneyRisk = cap(kidneyScore);

  const avgRisk = (heartAttackRisk + hypertensionRisk + diabetesRisk + strokeRisk + hereditaryLoadRisk) / 5;
  const compositeHealthScore = Math.max(10, Math.min(99, Math.round(100 - avgRisk * 0.85)));

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
    personName: personName || "Target Profile",
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

function RiskPrediction() {
  const { token, user } = useAuth();

  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);

  const [form, setForm] = useState({
    fullName: "Person Profile",
    age: 35,
    gender: "Male",
    heightCm: 170,
    weightKg: 72,
    bmi: 24.9,
    systolicBp: 124,
    diastolicBp: 82,
    heartRate: 72,
    fastingGlucose: 102,
    hba1c: 5.5,
    cholesterol: 195,
    
    // Hereditary Family Tree
    fatherHistory: "None",
    motherHistory: "None",
    paternalGrandfather: "None",
    paternalGrandmother: "None",
    maternalGrandfather: "None",
    maternalGrandmother: "None",
    siblingsHistory: "None",
    previousHeartAttacks: "No",

    // Lifestyle & Work Habits
    activityMinutes: 30,
    dietPattern: "Balanced",
    saltIntake: "Normal",
    smokingStatus: "Non-Smoker",
    alcoholConsumption: "None",
    stressPower: 4,
    sleepHours: 7,
    meditation: "No",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Load family members & prefill
  useEffect(() => {
    async function loadMembers() {
      try {
        const memRes = await getMembers(token);
        const memList = Array.isArray(memRes?.data) ? memRes.data : [];
        setMembers(memList);

        if (memList.length > 0) {
          const defaultMem = memList[0];
          setSelectedMemberId(defaultMem._id);
          setSelectedMember(defaultMem);
          populateFormFromMember(defaultMem);
        }
      } catch {
        // Fallback
      }
    }

    loadMembers();
  }, [token]);

  const populateFormFromMember = (mem) => {
    if (!mem) return;
    const age = calculateAgeFromDob(mem.dateOfBirth);
    const height = mem.heightCm || 170;
    const weight = mem.weightKg || 72;
    const computedBmi = Number((weight / ((height / 100) * (height / 100))).toFixed(1));

    const newForm = {
      ...form,
      fullName: mem.fullName || "Target Profile",
      age,
      gender: mem.gender || "Male",
      heightCm: height,
      weightKg: weight,
      bmi: mem.bmi || computedBmi || 24.9,
      systolicBp: mem.systolicBp || 124,
      diastolicBp: mem.diastolicBp || 82,
      fastingGlucose: mem.fastingGlucose || 102,
      cholesterol: mem.cholesterol || 195,
      sleepHours: mem.sleepHours || 7,
      activityMinutes: mem.activityMinutes || 30,
      fatherHistory: mem.familyDiseases && mem.familyDiseases.includes("Father") ? "Hypertension & Heart Attack" : "None",
      motherHistory: mem.familyDiseases && mem.familyDiseases.includes("Mother") ? "Type-2 Diabetes" : "None",
    };

    setForm(newForm);
  };

  const handleMemberChange = (e) => {
    const memId = e.target.value;
    setSelectedMemberId(memId);
    const found = members.find((m) => String(m._id) === String(memId));
    if (found) {
      setSelectedMember(found);
      populateFormFromMember(found);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = {
        ...prev,
        [name]: name.includes("Bp") || name.includes("Glucose") || name.includes("cholesterol") || name.includes("age") || name.includes("height") || name.includes("weight") || name.includes("stress") || name.includes("sleep") || name.includes("activity") || name.includes("heartRate") || name.includes("hba1c") ? Number(value) || value : value,
      };

      // Auto-compute BMI if height or weight changes
      if (name === "heightCm" || name === "weightKg") {
        const h = Number(name === "heightCm" ? value : prev.heightCm) || 170;
        const w = Number(name === "weightKg" ? value : prev.weightKg) || 72;
        updated.bmi = Number((w / ((h / 100) * (h / 100))).toFixed(1));
      }

      return updated;
    });
  };

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    const personName = selectedMember?.fullName || form.fullName || "Target Profile";

    // 1. Instant local calculation guarantees results render immediately on button click!
    const localRes = computeRiskLocally(form, personName);
    setResult(localRes);

    // 2. Send API request to backend
    try {
      if (token) {
        const res = await predictAIRisk(token, {
          ...form,
          name: personName,
        });
        if (res && res.success && res.data) {
          setResult(res.data);
        }
      }
    } catch (err) {
      // Local calculation already set
      console.log("Using instant local risk calculator", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-trigger prediction when member changes
  useEffect(() => {
    handlePredict();
  }, [selectedMemberId]);

  const getRiskBadge = (level, percentage) => {
    let cls = "low";
    if (percentage >= 70) cls = "high";
    else if (percentage >= 50) cls = "elevated";
    else if (percentage >= 25) cls = "moderate";

    return <span className={`risk-tag ${cls}`}>{level} ({percentage}%)</span>;
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 70) return "#ef4444";
    if (percentage >= 50) return "#f97316";
    if (percentage >= 25) return "#f59e0b";
    return "#10b981";
  };

  return (
    <DashboardLayout>
      <div className="risk-prediction-container">
        <header className="page-header">
          <div className="header-flex-row">
            <div>
              <span className="badge">MODULE 2: AI MULTI-DISEASE RISK PREDICTION ENGINE</span>
              <h2>Hereditary & Chronic Disease Future Risk Predictor</h2>
              <p>
                Multi-factorial risk calculation for Heart Attack, Hypertension, Diabetes, Stroke & Genetic Inheritance for <strong>{selectedMember?.fullName || form.fullName}</strong>.
              </p>
            </div>

            {/* Member Profile Selector */}
            <div className="profile-selector-box">
              <label>👤 Select Target Member:</label>
              <select
                value={selectedMemberId}
                onChange={handleMemberChange}
                className="member-select-dropdown"
              >
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.fullName} ({m.relation || m.gender || "Member"})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {error && <div className="error-alert">{error}</div>}

        <div className="risk-grid">
          {/* Detailed Input Form */}
          <form className="risk-form-card" onSubmit={handlePredict}>
            <div className="form-header-title">
              <h3>📋 Clinical Vitals & Hereditary Input Form</h3>
              <span className="form-subtitle">Fill clinical metrics below and click Recalculate Risk</span>
            </div>

            {/* Form Section 1: Basic Vitals */}
            <div className="form-section-block">
              <h4 className="section-hdr">1. Person Profile & Basic Vitals</h4>
              <div className="form-grid-3col">
                <div className="field-group">
                  <label>Age (Years)</label>
                  <input type="number" name="age" value={form.age} onChange={handleChange} required />
                </div>

                <div className="field-group">
                  <label>Gender</label>
                  <select name="gender" value={form.gender} onChange={handleChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="field-group">
                  <label>Height (cm)</label>
                  <input type="number" name="heightCm" value={form.heightCm} onChange={handleChange} required />
                </div>

                <div className="field-group">
                  <label>Weight (kg)</label>
                  <input type="number" name="weightKg" value={form.weightKg} onChange={handleChange} required />
                </div>

                <div className="field-group">
                  <label>BMI (Auto-Calculated)</label>
                  <input type="number" step="0.1" name="bmi" value={form.bmi} onChange={handleChange} readOnly style={{ background: "#f1f5f9", fontWeight: 700 }} />
                </div>

                <div className="field-group">
                  <label>Resting Heart Rate (bpm) [60-100]</label>
                  <input type="number" name="heartRate" value={form.heartRate} onChange={handleChange} required />
                </div>
              </div>
            </div>

            {/* Form Section 2: Clinical Vitals */}
            <div className="form-section-block">
              <h4 className="section-hdr">2. Cardiovascular & Metabolic Laboratory Vitals</h4>
              <div className="form-grid-3col">
                <div className="field-group">
                  <label>Systolic BP (mmHg) [Avg 120]</label>
                  <input type="number" name="systolicBp" value={form.systolicBp} onChange={handleChange} required />
                </div>

                <div className="field-group">
                  <label>Diastolic BP (mmHg) [Avg 80]</label>
                  <input type="number" name="diastolicBp" value={form.diastolicBp} onChange={handleChange} required />
                </div>

                <div className="field-group">
                  <label>Fasting Glucose (mg/dL) [70-99]</label>
                  <input type="number" name="fastingGlucose" value={form.fastingGlucose} onChange={handleChange} required />
                </div>

                <div className="field-group">
                  <label>HbA1c Level (%) [&lt;5.7%]</label>
                  <input type="number" step="0.1" name="hba1c" value={form.hba1c} onChange={handleChange} required />
                </div>

                <div className="field-group">
                  <label>Total Cholesterol (mg/dL) [&lt;200]</label>
                  <input type="number" name="cholesterol" value={form.cholesterol} onChange={handleChange} required />
                </div>
              </div>
            </div>

            {/* Form Section 3: Hereditary Family Tree */}
            <div className="form-section-block">
              <h4 className="section-hdr">3. Multi-Generational Family Tree & Hereditary History</h4>
              <div className="form-grid-2col">
                <div className="field-group">
                  <label>Father's Medical History</label>
                  <select name="fatherHistory" value={form.fatherHistory} onChange={handleChange}>
                    <option value="None">None / Healthy</option>
                    <option value="Hypertension">Hypertension (High BP)</option>
                    <option value="Diabetes">Type-2 Diabetes</option>
                    <option value="Heart Attack">Heart Attack / Cardiac Event</option>
                    <option value="Stroke">Stroke / Vascular Event</option>
                  </select>
                </div>

                <div className="field-group">
                  <label>Mother's Medical History</label>
                  <select name="motherHistory" value={form.motherHistory} onChange={handleChange}>
                    <option value="None">None / Healthy</option>
                    <option value="Hypertension">Hypertension (High BP)</option>
                    <option value="Diabetes">Type-2 Diabetes</option>
                    <option value="Heart Attack">Heart Attack / Cardiac Event</option>
                    <option value="Stroke">Stroke / Vascular Event</option>
                  </select>
                </div>

                <div className="field-group">
                  <label>Paternal Grandfather History</label>
                  <select name="paternalGrandfather" value={form.paternalGrandfather} onChange={handleChange}>
                    <option value="None">None / Healthy</option>
                    <option value="Heart Attack">Heart Attack / Cardiac</option>
                    <option value="Diabetes">Type-2 Diabetes</option>
                    <option value="Hypertension">Hypertension</option>
                  </select>
                </div>

                <div className="field-group">
                  <label>Paternal Grandmother History</label>
                  <select name="paternalGrandmother" value={form.paternalGrandmother} onChange={handleChange}>
                    <option value="None">None / Healthy</option>
                    <option value="Hypertension">Hypertension</option>
                    <option value="Diabetes">Type-2 Diabetes</option>
                  </select>
                </div>

                <div className="field-group">
                  <label>Maternal Grandfather History</label>
                  <select name="maternalGrandfather" value={form.maternalGrandfather} onChange={handleChange}>
                    <option value="None">None / Healthy</option>
                    <option value="Heart Attack">Heart Attack / Cardiac</option>
                    <option value="Hypertension">Hypertension</option>
                  </select>
                </div>

                <div className="field-group">
                  <label>Maternal Grandmother History</label>
                  <select name="maternalGrandmother" value={form.maternalGrandmother} onChange={handleChange}>
                    <option value="None">None / Healthy</option>
                    <option value="Diabetes">Type-2 Diabetes</option>
                    <option value="Hypertension">Hypertension</option>
                  </select>
                </div>

                <div className="field-group">
                  <label>Siblings History</label>
                  <select name="siblingsHistory" value={form.siblingsHistory} onChange={handleChange}>
                    <option value="None">None / Healthy</option>
                    <option value="Hypertension">Hypertension</option>
                    <option value="Diabetes">Type-2 Diabetes</option>
                  </select>
                </div>

                <div className="field-group">
                  <label>Previous Family Cardiac Events / Heart Attacks?</label>
                  <select name="previousHeartAttacks" value={form.previousHeartAttacks} onChange={handleChange}>
                    <option value="No">No Previous Heart Attacks</option>
                    <option value="Yes">Yes - Family History of Cardiac Attack</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Form Section 4: Lifestyle & Work Attributes */}
            <div className="form-section-block">
              <h4 className="section-hdr">4. Lifestyle Habits, Diet & Stress Attributes</h4>
              <div className="form-grid-3col">
                <div className="field-group">
                  <label>Physical Activity (Mins/Day)</label>
                  <input type="number" name="activityMinutes" value={form.activityMinutes} onChange={handleChange} required />
                </div>

                <div className="field-group">
                  <label>Dietary Pattern</label>
                  <select name="dietPattern" value={form.dietPattern} onChange={handleChange}>
                    <option value="Balanced">Balanced / Healthy Diet</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="High Sodium / Processed">High Sodium & Processed Food</option>
                  </select>
                </div>

                <div className="field-group">
                  <label>Salt Intake</label>
                  <select name="saltIntake" value={form.saltIntake} onChange={handleChange}>
                    <option value="Normal">Normal Salt Intake</option>
                    <option value="High">High Salt Intake</option>
                  </select>
                </div>

                <div className="field-group">
                  <label>Smoking Status</label>
                  <select name="smokingStatus" value={form.smokingStatus} onChange={handleChange}>
                    <option value="Non-Smoker">Non-Smoker</option>
                    <option value="Occasional">Occasional Smoker</option>
                    <option value="Regular Smoker">Regular / Heavy Smoker</option>
                  </select>
                </div>

                <div className="field-group">
                  <label>Alcohol Consumption</label>
                  <select name="alcoholConsumption" value={form.alcoholConsumption} onChange={handleChange}>
                    <option value="None">None / Social</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Heavy">Heavy</option>
                  </select>
                </div>

                <div className="field-group">
                  <label>Work & Mind Stress Power (1 to 10)</label>
                  <input type="number" min="1" max="10" name="stressPower" value={form.stressPower} onChange={handleChange} required />
                </div>

                <div className="field-group">
                  <label>Sleep Duration (Hours/Night)</label>
                  <input type="number" step="0.5" name="sleepHours" value={form.sleepHours} onChange={handleChange} required />
                </div>

                <div className="field-group">
                  <label>Daily Meditation Routine?</label>
                  <select name="meditation" value={form.meditation} onChange={handleChange}>
                    <option value="No">No</option>
                    <option value="Yes">Yes (20+ mins daily)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Recalculate Risk Action Button */}
            <button type="submit" className="predict-btn" disabled={loading}>
              {loading
                ? "Calculating AI Disease Risk Models..."
                : `🧪 Recalculate Future Disease Risk Now for ${selectedMember?.fullName || form.fullName}`}
            </button>
          </form>

          {/* Results Display Area */}
          <div className="results-card">
            {result ? (
              <div className="analysis-output">
                {/* Composite AI Health Header */}
                <div className="score-header">
                  <div className="composite-circle">
                    <span className="score-val">{result.compositeHealthScore}</span>
                    <span className="score-label">AI Health Score</span>
                  </div>
                  <div>
                    <h4>AI Risk Profile for {selectedMember?.fullName || form.fullName}</h4>
                    <p className="specialist-recommend">
                      Recommended Specialist: <strong>{result.recommendedSpecialist}</strong>
                    </p>
                  </div>
                </div>

                {/* DISEASE SPECIFIC PREDICTION CARDS */}
                <h4 className="section-title">🔮 Predicted Disease Risk Categories & Horizons</h4>
                <div className="disease-cards-container">
                  {(result.diseaseRiskCards || []).map((card) => (
                    <div key={card.id} className="disease-card-item">
                      <div className="disease-card-top">
                        <div className="dc-title-box">
                          <span className="dc-icon">{card.icon}</span>
                          <div>
                            <h5>{card.name}</h5>
                            <span className="dc-horizon">⏳ {card.horizon}</span>
                          </div>
                        </div>
                        {getRiskBadge(card.level, card.risk)}
                      </div>

                      {/* Risk Percentage Bar */}
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${card.risk}%`,
                            backgroundColor: getProgressBarColor(card.risk),
                          }}
                        />
                      </div>

                      <div className="disease-card-details">
                        <p className="dc-driver">
                          <strong>Driving Factor:</strong> {card.primaryDriver}
                        </p>
                        <p className="dc-key">
                          <strong>Prevention Key:</strong> {card.preventionKey}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Clinical Justifications */}
                {result.justifications?.length > 0 && (
                  <div className="justifications-block">
                    <h5>📋 Clinical Justifications Log</h5>
                    <ul>
                      {result.justifications.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations?.length > 0 && (
                  <div className="recommendations-block">
                    <h5>💡 Doctor & Preventive Action Recommendations</h5>
                    <ul>
                      {result.recommendations.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="disclaimer-banner">
                  ⚠️ <strong>Medical Safety Disclaimer (NFR-3.1):</strong> {result.disclaimer}
                </div>
              </div>
            ) : (
              <div className="empty-results">
                <span className="icon">🧪</span>
                <h4>Ready for Risk Detection & Analysis</h4>
                <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#64748b", lineHeight: "1.4" }}>
                  Select or fill clinical vitals, hereditary family tree history, and lifestyle attributes on the left form for <strong>{selectedMember?.fullName || form.fullName}</strong>, then click <strong>"🧪 Recalculate Future Disease Risk Now"</strong> to calculate and display disease risk predictions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default RiskPrediction;
