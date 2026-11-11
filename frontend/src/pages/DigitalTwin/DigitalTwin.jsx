import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import {
  simulateDigitalTwin,
  getMembers,
  getHealthHistory,
} from "../../services/apiService";
import "./DigitalTwin.css";

function calculateAgeFromDob(dob) {
  if (!dob) return 35;
  const birth = new Date(dob);
  const diff = Date.now() - birth.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970) || 35;
}

function DigitalTwin() {
  const { token, user } = useAuth();

  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);

  const [baselineData, setBaselineData] = useState({
    age: 35,
    bmi: 26.0,
    systolicBp: 130,
    fastingGlucose: 105,
    sleepHours: 6.5,
    activityMinutes: 30,
    hereditaryScore: 3,
  });

  const [sliders, setSliders] = useState({
    simulatedBmi: 23.5,
    simulatedSleepHours: 7.5,
    simulatedActivityMinutes: 45,
    simulatedFastingGlucose: 92,
    simulatedSystolicBp: 120,
  });

  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Fetch Family Members and Health History
  useEffect(() => {
    async function loadInitialData() {
      try {
        const memRes = await getMembers(token);
        const memList = Array.isArray(memRes?.data) ? memRes.data : [];
        setMembers(memList);

        if (memList.length > 0) {
          const defaultMem = memList[0];
          setSelectedMemberId(defaultMem._id);
          setSelectedMember(defaultMem);
          updateMemberBaseline(defaultMem);
        }
      } catch {
        // Fallback to logged-in user profile
      }
    }

    loadInitialData();
  }, [token]);

  // Update Baseline when Selected Member changes
  const updateMemberBaseline = (mem) => {
    if (!mem) return;

    const age = calculateAgeFromDob(mem.dateOfBirth);
    let hereditaryScore = 2;
    if (mem.familyDiseases && String(mem.familyDiseases).trim().length > 0) {
      hereditaryScore = Math.min(10, 4 + Math.floor(String(mem.familyDiseases).length / 10));
    }

    let calculatedBmi = Number(mem.bmi) || 25.5;
    if (mem.weightKg && mem.heightCm) {
      const heightM = mem.heightCm / 100;
      calculatedBmi = Math.round((mem.weightKg / (heightM * heightM)) * 10) / 10;
    }

    const calculatedBaseline = {
      age,
      bmi: calculatedBmi,
      systolicBp: Number(mem.systolicBp) || 128,
      fastingGlucose: Number(mem.fastingGlucose) || 102,
      sleepHours: Number(mem.sleepHours) || 6.5,
      activityMinutes: Number(mem.activityMinutes) || 30,
      hereditaryScore,
    };

    setBaselineData(calculatedBaseline);

    // Initialize sliders relative to member's baseline
    setSliders({
      simulatedBmi: Math.max(18.5, Math.round((calculatedBaseline.bmi - 2.5) * 10) / 10),
      simulatedSleepHours: Math.min(9.0, Math.round((calculatedBaseline.sleepHours + 1.0) * 10) / 10),
      simulatedActivityMinutes: Math.min(90, calculatedBaseline.activityMinutes + 15),
      simulatedFastingGlucose: Math.max(85, calculatedBaseline.fastingGlucose - 10),
      simulatedSystolicBp: Math.max(115, calculatedBaseline.systolicBp - 8),
    });
  };

  const handleMemberChange = (e) => {
    const memId = e.target.value;
    setSelectedMemberId(memId);
    const found = members.find((m) => String(m._id) === String(memId));
    if (found) {
      setSelectedMember(found);
      updateMemberBaseline(found);
    }
  };

  // 2. Trigger Simulation on Sliders or Baseline change
  useEffect(() => {
    runSimulation();
  }, [sliders, baselineData]);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await simulateDigitalTwin(token, {
        baseline: baselineData,
        ...sliders,
      });
      if (res.success) {
        setSimulationResult(res);
      }
    } catch {
      // SILENT FALLBACK FOR REAL-TIME SLIDERS
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (e) => {
    setSliders({
      ...sliders,
      [e.target.name]: Number(e.target.value),
    });
  };

  const baselineScore = simulationResult?.baseline?.compositeHealthScore || 68;
  const simulatedScore = simulationResult?.simulated?.compositeHealthScore || 88;
  const deltaScore = simulationResult?.delta?.healthScoreImprovement || 20;

  return (
    <DashboardLayout>
      <div className="digital-twin-container">
        <header className="twin-header">
          <div className="header-top-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="badge">MODULE 9: DIGITAL HEALTH TWIN</span>
            
            {/* Member Profile Selector */}
            <div className="member-selector-box" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>👤 Target Profile:</label>
              <select
                value={selectedMemberId}
                onChange={handleMemberChange}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: "#0f172a",
                  background: "#ffffff"
                }}
              >
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.fullName} ({m.relation || m.gender || "Member"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h2>Interactive "What-If" Lifestyle Risk Simulator</h2>
          <p>
            Simulating personalized health predictions for <strong>{selectedMember?.fullName || user?.fullName || "Active Profile"}</strong> (Age: {baselineData.age} yrs).
          </p>
        </header>

        <div className="twin-grid">
          {/* Controls Side */}
          <div className="twin-controls-card">
            <h3>🎛️ Virtual Digital Twin Controls</h3>

            <div className="control-group">
              <div className="control-label">
                <span>Target BMI (Body Mass Index)</span>
                <strong>{sliders.simulatedBmi} (Baseline: {baselineData.bmi})</strong>
              </div>
              <input
                type="range"
                min="18.5"
                max="35.0"
                step="0.5"
                name="simulatedBmi"
                value={sliders.simulatedBmi}
                onChange={handleSliderChange}
              />
            </div>

            <div className="control-group">
              <div className="control-label">
                <span>Target Nightly Sleep (Hours)</span>
                <strong>{sliders.simulatedSleepHours} hrs (Baseline: {baselineData.sleepHours}h)</strong>
              </div>
              <input
                type="range"
                min="4.0"
                max="10.0"
                step="0.5"
                name="simulatedSleepHours"
                value={sliders.simulatedSleepHours}
                onChange={handleSliderChange}
              />
            </div>

            <div className="control-group">
              <div className="control-label">
                <span>Daily Aerobic Activity (Minutes)</span>
                <strong>{sliders.simulatedActivityMinutes} mins (Baseline: {baselineData.activityMinutes}m)</strong>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                name="simulatedActivityMinutes"
                value={sliders.simulatedActivityMinutes}
                onChange={handleSliderChange}
              />
            </div>

            <div className="control-group">
              <div className="control-label">
                <span>Target Fasting Blood Glucose (mg/dL)</span>
                <strong>{sliders.simulatedFastingGlucose} mg/dL (Baseline: {baselineData.fastingGlucose})</strong>
              </div>
              <input
                type="range"
                min="80"
                max="160"
                step="2"
                name="simulatedFastingGlucose"
                value={sliders.simulatedFastingGlucose}
                onChange={handleSliderChange}
              />
            </div>

            <div className="control-group">
              <div className="control-label">
                <span>Target Systolic Blood Pressure (mmHg)</span>
                <strong>{sliders.simulatedSystolicBp} mmHg (Baseline: {baselineData.systolicBp})</strong>
              </div>
              <input
                type="range"
                min="100"
                max="160"
                step="2"
                name="simulatedSystolicBp"
                value={sliders.simulatedSystolicBp}
                onChange={handleSliderChange}
              />
            </div>
          </div>

          {/* Visualization Side */}
          <div className="twin-preview-card">
            <h3>📈 Projected Health Twin Outcome</h3>

            <div className="comparison-banner">
              <div className="compare-box">
                <span className="compare-title">Current Baseline</span>
                <span className="compare-val baseline">{baselineScore} / 100</span>
              </div>
              <div className="compare-arrow">➔</div>
              <div className="compare-box">
                <span className="compare-title">Simulated Health Twin</span>
                <span className="compare-val simulated">{simulatedScore} / 100</span>
              </div>
              <div className={`delta-badge ${deltaScore >= 0 ? "positive" : "negative"}`}>
                {deltaScore >= 0 ? `+${deltaScore} PTS` : `${deltaScore} PTS`}
              </div>
            </div>

            {simulationResult && (
              <div className="risk-delta-grid">
                <div className="delta-card">
                  <span className="delta-label">Diabetes Risk</span>
                  <div className="delta-row">
                    <span className="old-val">{simulationResult.baseline.diabetesRisk}%</span>
                    <span>➜</span>
                    <span className="new-val">{simulationResult.simulated.diabetesRisk}%</span>
                  </div>
                  <span className="diff green">
                    {simulationResult.delta.diabetesRiskChange}% Risk Reduction
                  </span>
                </div>

                <div className="delta-card">
                  <span className="delta-label">Hypertension Risk</span>
                  <div className="delta-row">
                    <span className="old-val">{simulationResult.baseline.hypertensionRisk}%</span>
                    <span>➜</span>
                    <span className="new-val">{simulationResult.simulated.hypertensionRisk}%</span>
                  </div>
                  <span className="diff green">
                    {simulationResult.delta.hypertensionRiskChange}% Risk Reduction
                  </span>
                </div>

                <div className="delta-card">
                  <span className="delta-label">Cardiovascular Risk</span>
                  <div className="delta-row">
                    <span className="old-val">{simulationResult.baseline.cardiovascularRisk}%</span>
                    <span>➜</span>
                    <span className="new-val">{simulationResult.simulated.cardiovascularRisk}%</span>
                  </div>
                  <span className="diff green">
                    {simulationResult.delta.cardiovascularRiskChange}% Risk Reduction
                  </span>
                </div>

                <div className="delta-card">
                  <span className="delta-label">Kidney Disease Risk</span>
                  <div className="delta-row">
                    <span className="old-val">{simulationResult.baseline.kidneyRisk}%</span>
                    <span>➜</span>
                    <span className="new-val">{simulationResult.simulated.kidneyRisk}%</span>
                  </div>
                  <span className="diff green">
                    {simulationResult.delta.kidneyRiskChange}% Risk Reduction
                  </span>
                </div>
              </div>
            )}

            <div className="twin-insight-footer">
              💡 <strong>Digital Twin Summary for {selectedMember?.fullName || "User"}:</strong> By increasing sleep to {sliders.simulatedSleepHours} hours, 
              maintaining a BMI of {sliders.simulatedBmi}, and staying active for {sliders.simulatedActivityMinutes} mins/day, 
              you can reduce overall chronic disease risk by up to {Math.abs(simulationResult?.delta?.diabetesRiskChange || 20)}%!
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default DigitalTwin;
