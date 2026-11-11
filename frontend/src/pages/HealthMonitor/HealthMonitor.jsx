import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";

import { runEdgeHealthRiskInference } from "../../services/edgeHealthRiskEngine";
import { runMLHealthRiskInference } from "../../services/mlHealthRiskEngine";
import { runEnvironmentalHealthFusion } from "../../services/environmentHealthFusion";
import { DeviceSensorManager, isDeviceSensorSupported } from "../../services/deviceSensorService";
import { getAvailableDeviceProfiles, normalizeDeviceReading } from "../../services/deviceIntegration";
import { saveOfflineHealthReading, getOfflineHealthReadings } from "../../services/offlineHealthStore";
import { queueForSync } from "../../services/offlineSync";

import {
  getMembers,
  createDemoVitalReading,
  getVitalReadings,
  getLatestVitalReading,
  calculatePersonalBaseline,
  getPersonalBaseline,
  analyzeVitalAnomalies,
  getEnvironmentalData,
  analyzeEnvironmentalRisks,
  simulateHealthAnomaly,
} from "../../services/apiService";

const HealthMonitor = () => {
  const { token } = useAuth();

  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");

  const [readings, setReadings] = useState([]);
  const [latestReading, setLatestReading] = useState(null);

  const [baseline, setBaseline] = useState(null);
  const [anomalyAnalysis, setAnomalyAnalysis] = useState(null);
  const [edgeRisk, setEdgeRisk] = useState(null);
  const [mlRisk, setMlRisk] = useState(null);
  const [environmentHealthFusion, setEnvironmentHealthFusion] = useState(null);

  const [environment, setEnvironment] = useState(null);
  const [environmentLoading, setEnvironmentLoading] = useState(false);
  const [environmentError, setEnvironmentError] = useState("");

  const [environmentRiskAnalysis, setEnvironmentRiskAnalysis] =
    useState(null);
  const [environmentRiskLoading, setEnvironmentRiskLoading] =
    useState(false);
  const [environmentRiskError, setEnvironmentRiskError] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [analyzingAnomalies, setAnalyzingAnomalies] = useState(false);
  const [simulatingScenario, setSimulatingScenario] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState("high_heart_rate");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [sensorManager, setSensorManager] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [sensorStatus, setSensorStatus] = useState("Sensors not connected.");
  const [sensorActive, setSensorActive] = useState(false);
  const [deviceType, setDeviceType] = useState("smartphone");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueueCount, setOfflineQueueCount] = useState(getOfflineHealthReadings().length);

  useEffect(() => {
    loadMembers();
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => { window.removeEventListener("online", online); window.removeEventListener("offline", offline); };
  }, []);

  useEffect(() => () => sensorManager?.stop(), [sensorManager]);

  useEffect(() => {
    if (latestReading) {
      setEdgeRisk(runEdgeHealthRiskInference(latestReading));
      setMlRisk(runMLHealthRiskInference(latestReading));
    } else {
      setEdgeRisk(null);
      setMlRisk(null);
    }
  }, [latestReading]);

  useEffect(() => {
    if (latestReading && environment) {
      setEnvironmentHealthFusion(
        runEnvironmentalHealthFusion({
          reading: latestReading,
          environment,
          mlRisk,
          edgeRisk,
        })
      );
    } else {
      setEnvironmentHealthFusion(null);
    }
  }, [latestReading, environment, mlRisk, edgeRisk]);

  useEffect(() => {
    if (selectedMemberId) {
      loadHealthData(selectedMemberId);
      setEnvironmentRiskAnalysis(null);
      setEnvironmentRiskError("");
    }
  }, [selectedMemberId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMembers(token);

      const memberList =
        response?.members ||
        response?.data ||
        response ||
        [];

      setMembers(Array.isArray(memberList) ? memberList : []);

      if (Array.isArray(memberList) && memberList.length > 0) {
        setSelectedMemberId(memberList[0]._id);
      }
    } catch (err) {
      console.error("Failed to load family members:", err);

      setError(
        err.message ||
          "Failed to load family members."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadHealthData = async (memberId) => {
    try {
      setError("");

      const [
        readingsResponse,
        latestResponse,
        baselineResponse,
      ] = await Promise.allSettled([
        getVitalReadings(token, memberId, 20),
        getLatestVitalReading(token, memberId),
        getPersonalBaseline(token, memberId),
      ]);

      if (readingsResponse.status === "fulfilled") {
        const data =
          readingsResponse.value?.readings ||
          readingsResponse.value?.data ||
          readingsResponse.value ||
          [];

        setReadings(
          Array.isArray(data) ? data : []
        );
      } else {
        setReadings([]);
      }

      if (latestResponse.status === "fulfilled") {
        const latest =
          latestResponse.value?.reading ||
          latestResponse.value?.data ||
          latestResponse.value ||
          null;

        setLatestReading(latest);
      } else {
        setLatestReading(null);
      }

      if (baselineResponse.status === "fulfilled") {
        const baselineData =
          baselineResponse.value?.baseline ||
          baselineResponse.value?.data ||
          baselineResponse.value ||
          null;

        setBaseline(baselineData);
      } else {
        setBaseline(null);
      }
    } catch (err) {
      console.error("Failed to load health data:", err);

      setError(
        err.message ||
          "Failed to load health monitoring data."
      );
    }
  };

  const startDeviceSensors = async () => {
    try {
      setError("");
      const manager = new DeviceSensorManager({
        onUpdate: (data) => setSensorData(normalizeDeviceReading(data, deviceType)),
        onStatus: (status) => setSensorStatus(status),
      });
      setSensorManager(manager);
      await manager.startMotion();
      try { await manager.connectBluetooth(); } catch (bluetoothError) {
        setSensorStatus(`Motion active. ${bluetoothError.message || "Bluetooth wearable not connected."}`);
      }
      setSensorActive(true);
    } catch (err) {
      setError(err.message || "Unable to start device sensors.");
      setSensorActive(false);
    }
  };

  const stopDeviceSensors = () => {
    sensorManager?.stop();
    setSensorManager(null);
    setSensorActive(false);
    setSensorData(null);
  };

  const saveSensorReading = async () => {
    if (!selectedMemberId || !sensorData) return;
    try {
      const payload = {
        memberId: selectedMemberId,
        heartRate: sensorData.heartRate ?? undefined,
        spo2: sensorData.spo2 ?? undefined,
        bodyTemperature: sensorData.bodyTemperature ?? undefined,
        source: sensorData.source || deviceType,
        isSimulated: false,
      };
      if ([payload.heartRate, payload.spo2, payload.bodyTemperature].every((v) => v === undefined)) {
        setError("No wearable health measurement is available yet. Connect a compatible BLE wearable first.");
        return;
      }
      if (!navigator.onLine) {
        saveOfflineHealthReading(payload);
        queueForSync(payload);
        setOfflineQueueCount(getOfflineHealthReadings().length);
        setSuccessMessage("Saved locally. This reading is queued for synchronization when connectivity returns.");
        return;
      }
      try {
        await createVitalReading(token, payload);
        await loadHealthData(selectedMemberId);
        setSuccessMessage("Device sensor reading saved successfully.");
      } catch (apiError) {
        saveOfflineHealthReading(payload);
        queueForSync(payload);
        setOfflineQueueCount(getOfflineHealthReadings().length);
        setSuccessMessage("Server unavailable. Reading saved locally and queued for later synchronization.");
      }
    } catch (err) {
      setError(err.message || "Failed to save device sensor reading.");
    }
  };

  const generateReading = async () => {
    if (!selectedMemberId) {
      setError(
        "Please select a family member first."
      );
      return;
    }

    try {
      setGenerating(true);
      setError("");
      setSuccessMessage("");

      await createDemoVitalReading(
        token,
        selectedMemberId
      );

      await loadHealthData(selectedMemberId);

      setSuccessMessage(
        "New demo health reading generated successfully."
      );
    } catch (err) {
      console.error(
        "Failed to generate reading:",
        err
      );

      setError(
        err.message ||
          "Failed to generate health reading."
      );
    } finally {
      setGenerating(false);
    }
  };

  const calculateBaseline = async () => {
    if (!selectedMemberId) {
      setError(
        "Please select a family member first."
      );
      return;
    }

    try {
      setCalculating(true);
      setError("");
      setSuccessMessage("");

      const response =
        await calculatePersonalBaseline(
          token,
          selectedMemberId
        );

      const calculatedBaseline =
        response?.baseline ||
        response?.data ||
        response ||
        null;

      setBaseline(calculatedBaseline);

      setSuccessMessage(
        "Personal health baseline calculated successfully."
      );
    } catch (err) {
      console.error(
        "Failed to calculate baseline:",
        err
      );

      setError(
        err.message ||
          "Failed to calculate personal baseline."
      );
    } finally {
      setCalculating(false);
    }
  };

  const simulateAnomaly = async () => {
    if (!selectedMemberId) {
      setError("Please select a family member first.");
      return;
    }

    try {
      setSimulatingScenario(true);
      setError("");
      setSuccessMessage("");

      await simulateHealthAnomaly(token, selectedMemberId, selectedScenario);
      await loadHealthData(selectedMemberId);

      const response = await analyzeVitalAnomalies(token, selectedMemberId);
      setAnomalyAnalysis(response?.analysis || response?.data || response || null);
      setSuccessMessage("Simulated reading created and anomaly analysis completed. This is test data, not a real measurement.");
    } catch (err) {
      console.error("Failed to simulate anomaly:", err);
      setError(err.message || "Failed to simulate health anomaly.");
    } finally {
      setSimulatingScenario(false);
    }
  };

  const analyzeAnomalies = async () => {
    if (!selectedMemberId) {
      setError(
        "Please select a family member first."
      );
      return;
    }

    try {
      setAnalyzingAnomalies(true);
      setError("");
      setSuccessMessage("");

      const response =
        await analyzeVitalAnomalies(
          token,
          selectedMemberId
        );

      const analysis =
        response?.analysis ||
        response?.data ||
        response ||
        null;

      setAnomalyAnalysis(analysis);

      setSuccessMessage(
        "Health anomaly analysis completed."
      );
    } catch (err) {
      console.error(
        "Failed to analyze anomalies:",
        err
      );

      setError(
        err.message ||
          "Failed to analyze health anomalies."
      );
    } finally {
      setAnalyzingAnomalies(false);
    }
  };

  const fetchEnvironment = async () => {
    if (!selectedMemberId) {
      setEnvironmentError(
        "Please select a family member first."
      );
      return;
    }

    if (!navigator.geolocation) {
      setEnvironmentError(
        "Geolocation is not supported by this browser."
      );
      return;
    }

    try {
      setEnvironmentLoading(true);
      setEnvironmentError("");
      setEnvironmentRiskAnalysis(null);
      setEnvironmentRiskError("");

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const latitude =
              position.coords.latitude;

            const longitude =
              position.coords.longitude;

            const response =
              await getEnvironmentalData(
                token,
                latitude,
                longitude
              );

            const environmentData =
              response?.environment ||
              response?.data ||
              response ||
              null;

            setEnvironment(environmentData);
          } catch (err) {
            console.error(
              "Failed to fetch environment:",
              err
            );

            setEnvironmentError(
              err.message ||
                "Failed to fetch live environmental data."
            );
          } finally {
            setEnvironmentLoading(false);
          }
        },
        (geoError) => {
          console.error(
            "Geolocation error:",
            geoError
          );

          setEnvironmentError(
            "Location permission is required to fetch live environmental data."
          );

          setEnvironmentLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    } catch (err) {
      console.error(
        "Environment request error:",
        err
      );

      setEnvironmentError(
        err.message ||
          "Failed to get environmental data."
      );

      setEnvironmentLoading(false);
    }
  };

  const analyzeEnvironmentalRisk = async () => {
    if (!selectedMemberId) {
      setEnvironmentRiskError(
        "Please select a family member first."
      );
      return;
    }

    if (!environment) {
      setEnvironmentRiskError(
        "Please fetch live environment data first."
      );
      return;
    }

    if (!latestReading) {
      setEnvironmentRiskError(
        "No latest vital reading is available for this family member."
      );
      return;
    }

    try {
      setEnvironmentRiskLoading(true);
      setEnvironmentRiskError("");
      setSuccessMessage("");

      const result =
        await analyzeEnvironmentalRisks(
          token,
          selectedMemberId,
          environment
        );

      setEnvironmentRiskAnalysis(
        result?.analysis || null
      );

      setSuccessMessage(
        "Environmental health risk analysis completed."
      );
    } catch (error) {
      console.error(
        "Environmental risk analysis error:",
        error
      );

      setEnvironmentRiskError(
        error.message ||
          "Failed to analyze environmental risks."
      );
    } finally {
      setEnvironmentRiskLoading(false);
    }
  };

  const selectedMember = members.find(
    (member) =>
      String(member._id) ===
      String(selectedMemberId)
  );

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  const getStatusClass = (status) => {
    if (status === "critical") {
      return "status-critical";
    }

    if (status === "warning") {
      return "status-warning";
    }

    return "status-normal";
  };

  const getStatusLabel = (status) => {
    if (!status) return "Normal";

    return (
      status.charAt(0).toUpperCase() +
      status.slice(1)
    );
  };

  return (
    <DashboardLayout>
      <div className="health-monitor-page">
        <div className="page-header">
          <div>
            <h1>Health Monitor</h1>

            <p>
              Monitor vital signs, personal baselines,
              environmental conditions, and early
              health-risk indicators.
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success">
            {successMessage}
          </div>
        )}

        <section className={`offline-status-card ${isOnline ? "online" : "offline"}`}>
          <div>
            <strong>{isOnline ? "🟢 Online" : "🟠 Offline Mode"}</strong>
            <span>{isOnline ? "Server connectivity available. Local Edge AI remains available." : "Core local monitoring and Edge/ML inference can continue without internet."}</span>
          </div>
          <div className="offline-status-meta">
            <span>Local inference: ON</span>
            <span>Queued readings: {offlineQueueCount}</span>
          </div>
        </section>

        <section className="control-card">
          <div className="control-content">
            <div>
              <h2>Select Family Member</h2>

              <p>
                Choose a family member to view their
                monitoring information.
              </p>
            </div>

            <select
              value={selectedMemberId}
              onChange={(event) =>
                setSelectedMemberId(
                  event.target.value
                )
              }
              disabled={loading}
            >
              <option value="">
                Select a member
              </option>

              {members.map((member) => (
                <option
                  key={member._id}
                  value={member._id}
                >
                  {member.name ||
                    member.fullName ||
                    "Family Member"}
                </option>
              ))}
            </select>
          </div>
        </section>

        {selectedMemberId && (
          <>
            <section className="section-card">
              <div className="section-header">
                <div>
                  <h2>📱 Real-Time Device Sensors</h2>
                  <p>Use phone motion sensors and compatible Bluetooth Low Energy health wearables. Measurements remain in the browser until you choose to save them.</p>
                  <label className="device-type-label">Device type
                    <select value={deviceType} onChange={(event) => setDeviceType(event.target.value)} disabled={sensorActive}>
                      {getAvailableDeviceProfiles().map((profile) => (
                        <option key={profile.id} value={profile.id}>{profile.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                {!sensorActive ? (
                  <button type="button" className="primary-button" onClick={startDeviceSensors} disabled={!isDeviceSensorSupported()}>Start Device Sensors</button>
                ) : (
                  <button type="button" className="secondary-button" onClick={stopDeviceSensors}>Stop Sensors</button>
                )}
              </div>
              <div className="sensor-status-card">
                <strong>{sensorActive ? "● Live" : "○ Inactive"}</strong>
                <span>{sensorStatus}</span>
                <span>Heart rate: {sensorData?.heartRate ?? "—"} BPM</span>
                <span>SpO₂: {sensorData?.spo2 ?? "—"}%</span>
                <span>Body temperature: {sensorData?.bodyTemperature ?? "—"} °C</span>
                <span>Motion: {sensorData?.motion?.magnitude ? `${sensorData.motion.magnitude.toFixed(2)} m/s²` : "—"}</span>
                {sensorData && (sensorData.heartRate || sensorData.spo2 || sensorData.bodyTemperature) && (
                  <button type="button" className="secondary-button" onClick={saveSensorReading}>Save Wearable Reading</button>
                )}
              </div>
              <p className="sensor-note">Note: standard web APIs cannot read heart rate, SpO₂, or body temperature from a phone itself. Those values require a compatible BLE wearable. Motion/fall sensing can use the phone's built-in motion sensor.</p>
            </section>
            <section className="section-card">
              <div className="section-header">
                <div>
                  <h2>Current Health</h2>

                  <p>
                    Latest available health reading
                    for{" "}
                    <strong>
                      {selectedMember?.name ||
                        selectedMember?.fullName ||
                        "selected member"}
                    </strong>
                    .
                  </p>
                </div>

                <button
                  type="button"
                  className="primary-button"
                  onClick={generateReading}
                  disabled={generating}
                >
                  {generating
                    ? "Generating..."
                    : "Generate Demo Reading"}
                </button>
              </div>

              {latestReading ? (
                <div className="vitals-grid">
                  <div className="vital-card">
                    <span className="vital-label">
                      Heart Rate
                    </span>

                    <strong className="vital-value">
                      {latestReading.heartRate ??
                        "—"}
                    </strong>

                    <span className="vital-unit">
                      BPM
                    </span>
                  </div>

                  <div className="vital-card">
                    <span className="vital-label">
                      SpO₂
                    </span>

                    <strong className="vital-value">
                      {latestReading.spo2 ??
                        "—"}
                    </strong>

                    <span className="vital-unit">
                      %
                    </span>
                  </div>

                  <div className="vital-card">
                    <span className="vital-label">
                      Body Temperature
                    </span>

                    <strong className="vital-value">
                      {latestReading.bodyTemperature ??
                        "—"}
                    </strong>

                    <span className="vital-unit">
                      °C
                    </span>
                  </div>

                  <div className="vital-card">
                    <span className="vital-label">
                      Activity
                    </span>

                    <strong className="vital-value">
                      {latestReading.activityMinutes ??
                        "—"}
                    </strong>

                    <span className="vital-unit">
                      min
                    </span>
                  </div>

                  <div className="vital-card">
                    <span className="vital-label">
                      Sleep
                    </span>

                    <strong className="vital-value">
                      {latestReading.sleepHours ??
                        "—"}
                    </strong>

                    <span className="vital-unit">
                      hrs
                    </span>
                  </div>

                  <div className="vital-card">
                    <span className="vital-label">
                      AQI
                    </span>

                    <strong className="vital-value">
                      {latestReading.aqi ??
                        "—"}
                    </strong>

                    <span className="vital-unit">
                      index
                    </span>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <h3>
                    No health reading available
                  </h3>

                  <p>
                    Generate a demo reading to start
                    monitoring this member.
                  </p>
                </div>
              )}

              {latestReading?.recordedAt && (
                <p className="last-updated">
                  Last reading:{" "}
                  {formatDate(
                    latestReading.recordedAt
                  )}
                </p>
              )}
            </section>

            {edgeRisk && (
              <section className="section-card">
                <div className="section-header">
                  <div>
                    <h2>Edge AI Health Risk</h2>
                    <p>
                      Lightweight risk inference runs locally in this browser.
                      Health values are not sent to the server by this module.
                    </p>
                  </div>
                  <span className={`status-badge ${getStatusClass(
                    edgeRisk.level === "HIGH"
                      ? "critical"
                      : edgeRisk.level === "MODERATE"
                        ? "warning"
                        : "normal",
                  )}`}>
                    {edgeRisk.level}
                  </span>
                </div>

                <div className="vitals-grid">
                  <div className="vital-card">
                    <span className="vital-label">Local Risk Score</span>
                    <strong className="vital-value">{edgeRisk.riskPercent}%</strong>
                    <span className="vital-unit">on-device inference</span>
                  </div>
                  <div className="vital-card">
                    <span className="vital-label">Inference</span>
                    <strong className="vital-value">Local</strong>
                    <span className="vital-unit">No network required</span>
                  </div>
                </div>

                {edgeRisk.factors.length > 0 && (
                  <p className="last-updated">
                    Factors detected: {edgeRisk.factors.join(", ")}.
                  </p>
                )}

                <p className="last-updated">{edgeRisk.disclaimer}</p>
              </section>
            )}

            {mlRisk?.available && (
              <section className="section-card">
                <div className="section-header">
                  <div>
                    <h2>Local ML Health Risk</h2>
                    <p>
                      A trained logistic-regression model runs locally in the browser.
                      No health values are sent to the server by this inference step.
                    </p>
                  </div>
                  <span className={`status-badge ${getStatusClass(
                    mlRisk.level === "HIGH"
                      ? "critical"
                      : mlRisk.level === "MODERATE"
                        ? "warning"
                        : "normal",
                  )}`}>
                    {mlRisk.level}
                  </span>
                </div>

                <div className="vitals-grid">
                  <div className="vital-card">
                    <span className="vital-label">ML Risk Score</span>
                    <strong className="vital-value">{mlRisk.riskPercent}%</strong>
                    <span className="vital-unit">local inference</span>
                  </div>
                  <div className="vital-card">
                    <span className="vital-label">Model</span>
                    <strong className="vital-value" style={{ fontSize: "1rem" }}>
                      Logistic Regression
                    </strong>
                    <span className="vital-unit">device-side</span>
                  </div>
                </div>

                {mlRisk.factors.length > 0 && (
                  <p className="last-updated">
                    Contributing indicators: {mlRisk.factors.join(", ")}.
                  </p>
                )}

                {mlRisk.missingFeatures?.length > 0 && (
                  <p className="last-updated">
                    Missing sensor fields were handled locally: {mlRisk.missingFeatures.join(", ")}.
                  </p>
                )}

                <p className="last-updated">{mlRisk.disclaimer}</p>
              </section>
            )}

            {environmentHealthFusion?.available && (
              <section className="section-card">
                <div className="section-header">
                  <div>
                    <h2>Personalized Environment + Health Risk</h2>
                    <p>
                      Local fusion of physiological signals, environmental conditions, and the existing Edge/ML risk engines.
                    </p>
                  </div>
                  <span className={`status-badge ${getStatusClass(
                    environmentHealthFusion.level === "HIGH"
                      ? "critical"
                      : environmentHealthFusion.level === "MODERATE"
                        ? "warning"
                        : "normal"
                  )}`}>
                    {environmentHealthFusion.level}
                  </span>
                </div>

                <div className="vitals-grid">
                  <div className="vital-card">
                    <span className="vital-label">Fused Risk</span>
                    <strong className="vital-value">{environmentHealthFusion.riskPercent}%</strong>
                    <span className="vital-unit">local contextual score</span>
                  </div>
                  <div className="vital-card">
                    <span className="vital-label">Environmental Contribution</span>
                    <strong className="vital-value">{environmentHealthFusion.environmentalScore}</strong>
                    <span className="vital-unit">heat + air quality context</span>
                  </div>
                </div>

                {environmentHealthFusion.factors.length > 0 && (
                  <p className="last-updated">
                    <strong>Detected context:</strong> {environmentHealthFusion.factors.join(", ")}.
                  </p>
                )}

                <div className="risk-factors">
                  <h4>Personalized Recommendations</h4>
                  <ul>
                    {environmentHealthFusion.recommendations.map((recommendation) => (
                      <li key={recommendation}>{recommendation}</li>
                    ))}
                  </ul>
                </div>

                <p className="last-updated">{environmentHealthFusion.disclaimer}</p>
              </section>
            )}

            <section className="section-card">
              <div className="section-header">
                <div>
                  <h2>Live Environment</h2>

                  <p>
                    Environmental conditions based
                    on your permitted location.
                  </p>
                </div>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={fetchEnvironment}
                  disabled={environmentLoading}
                >
                  {environmentLoading
                    ? "Fetching..."
                    : "Get Live Environment"}
                </button>
              </div>

              {environmentError && (
                <div className="alert alert-error">
                  {environmentError}
                </div>
              )}

              {environment ? (
                <>
                  <div className="environment-grid">
                    <div className="environment-card">
                      <span>
                        Temperature
                      </span>

                      <strong>
                        {environment.weather
                          ?.temperature ??
                          "—"}
                        °C
                      </strong>
                    </div>

                    <div className="environment-card">
                      <span>Humidity</span>

                      <strong>
                        {environment.weather
                          ?.humidity ??
                          "—"}
                        %
                      </strong>
                    </div>

                    <div className="environment-card">
                      <span>Feels Like</span>

                      <strong>
                        {environment.weather
                          ?.apparentTemperature ??
                          "—"}
                        °C
                      </strong>
                    </div>

                    <div className="environment-card">
                      <span>AQI</span>

                      <strong>
                        {environment.airQuality
                          ?.aqi ??
                          "—"}
                      </strong>
                    </div>

                    <div className="environment-card">
                      <span>PM2.5</span>

                      <strong>
                        {environment.airQuality
                          ?.pm2_5 ??
                          "—"}
                      </strong>
                    </div>

                    <div className="environment-card">
                      <span>PM10</span>

                      <strong>
                        {environment.airQuality
                          ?.pm10 ??
                          "—"}
                      </strong>
                    </div>
                  </div>

                  <div className="environment-action">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={
                        analyzeEnvironmentalRisk
                      }
                      disabled={
                        environmentRiskLoading ||
                        !environment ||
                        !latestReading
                      }
                    >
                      {environmentRiskLoading
                        ? "Analyzing Health Risk..."
                        : "Analyze Environmental Health Risk"}
                    </button>
                  </div>

                  {environmentRiskError && (
                    <div className="alert alert-error">
                      {environmentRiskError}
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <h3>
                    Live environment not loaded
                  </h3>

                  <p>
                    Select “Get Live Environment” to
                    retrieve current temperature,
                    humidity, and air-quality data.
                  </p>
                </div>
              )}
            </section>

            {environmentRiskAnalysis && (
              <section className="section-card">
                <div className="section-header">
                  <div>
                    <h2>
                      Environmental Health Risk
                      Analysis
                    </h2>

                    <p>
                      Contextual analysis combining
                      environmental conditions with
                      the latest vital reading.
                    </p>
                  </div>

                  <span
                    className={`status-badge ${getStatusClass(
                      environmentRiskAnalysis.overallStatus
                    )}`}
                  >
                    {getStatusLabel(
                      environmentRiskAnalysis.overallStatus
                    )}
                  </span>
                </div>

                <div className="risk-analysis-grid">
                  {[
                    {
                      key: "heatStress",
                      title: "Heat Stress",
                    },
                    {
                      key: "dehydration",
                      title: "Dehydration Context",
                    },
                    {
                      key: "respiratory",
                      title: "Respiratory Context",
                    },
                  ].map((item) => {
                    const analysis =
                      environmentRiskAnalysis[
                        item.key
                      ];

                    if (!analysis) {
                      return null;
                    }

                    return (
                      <div
                        className="risk-analysis-card"
                        key={item.key}
                      >
                        <div className="risk-card-header">
                          <h3>
                            {item.title}
                          </h3>

                          <span
                            className={`status-badge ${getStatusClass(
                              analysis.status
                            )}`}
                          >
                            {getStatusLabel(
                              analysis.status
                            )}
                          </span>
                        </div>

                        <div className="risk-score">
                          <span>
                            Risk Score
                          </span>

                          <strong>
                            {analysis.score ?? 0}
                          </strong>
                        </div>

                        <p className="risk-message">
                          {analysis.message}
                        </p>

                        {analysis.factors &&
                          analysis.factors.length >
                            0 && (
                            <div className="risk-factors">
                              <h4>
                                Contributing Factors
                              </h4>

                              <ul>
                                {analysis.factors.map(
                                  (
                                    factor,
                                    index
                                  ) => (
                                    <li
                                      key={`${factor}-${index}`}
                                    >
                                      {factor}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>

                <div className="disclaimer">
                  <strong>
                    Informational notice:
                  </strong>{" "}
                  These environmental risk indicators
                  are contextual early-warning signals.
                  They are not medical diagnoses and
                  should not replace professional
                  medical advice.
                </div>
              </section>
            )}

            <section className="section-card">
              <div className="section-header">
                <div>
                  <h2>Personal Baseline</h2>

                  <p>
                    Your health patterns calculated
                    from available vital readings.
                  </p>
                </div>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={calculateBaseline}
                  disabled={calculating}
                >
                  {calculating
                    ? "Calculating..."
                    : "Calculate Baseline"}
                </button>
              </div>

              {baseline ? (
                <>
                  <div className="baseline-summary">
                    <div>
                      <span>
                        Readings Used
                      </span>

                      <strong>
                        {baseline.readingCount ??
                          "—"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Calculated At
                      </span>

                      <strong>
                        {formatDate(
                          baseline.calculatedAt
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="baseline-grid">
                    {[
                      {
                        name: "Heart Rate",
                        data:
                          baseline.heartRate,
                        unit: "BPM",
                      },
                      {
                        name: "SpO₂",
                        data: baseline.spo2,
                        unit: "%",
                      },
                      {
                        name: "Body Temperature",
                        data:
                          baseline.bodyTemperature,
                        unit: "°C",
                      },
                      {
                        name: "Activity",
                        data:
                          baseline.activityMinutes,
                        unit: "min",
                      },
                      {
                        name: "Sleep",
                        data:
                          baseline.sleepHours,
                        unit: "hrs",
                      },
                      {
                        name: "Environment Temperature",
                        data:
                          baseline.environmentalTemperature,
                        unit: "°C",
                      },
                      {
                        name: "Humidity",
                        data:
                          baseline.humidity,
                        unit: "%",
                      },
                      {
                        name: "AQI",
                        data: baseline.aqi,
                        unit: "",
                      },
                    ].map((item) => (
                      <div
                        className="baseline-card"
                        key={item.name}
                      >
                        <h3>
                          {item.name}
                        </h3>

                        <div className="baseline-value">
                          {item.data?.average ??
                            "—"}{" "}
                          {item.unit}
                        </div>

                        <div className="baseline-details">
                          <span>
                            Min:{" "}
                            {item.data?.minimum ??
                              "—"}
                          </span>

                          <span>
                            Max:{" "}
                            {item.data?.maximum ??
                              "—"}
                          </span>

                          <span>
                            SD:{" "}
                            {item.data
                              ?.standardDeviation ??
                              "—"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <h3>
                    Personal baseline not available
                  </h3>

                  <p>
                    Generate several readings and
                    calculate a baseline to establish
                    this member's normal health pattern.
                  </p>
                </div>
              )}
            </section>

            <section className="section-card">
              <div className="section-header">
                <div>
                  <h2>Simulate Health Anomaly</h2>
                  <p>Create a clearly labelled test reading to demonstrate the early-warning system.</p>
                </div>
              </div>
              <div className="simulator-controls">
                <select value={selectedScenario} onChange={(event) => setSelectedScenario(event.target.value)} disabled={simulatingScenario}>
                  <option value="high_heart_rate">High Heart Rate</option>
                  <option value="low_spo2">Low SpO₂</option>
                  <option value="high_temperature">High Body Temperature</option>
                  <option value="heat_stress">Heat Stress</option>
                  <option value="respiratory">Respiratory Risk</option>
                  <option value="fatigue">Fatigue</option>
                </select>
                <button type="button" className="primary-button" onClick={simulateAnomaly} disabled={simulatingScenario || !selectedMemberId}>
                  {simulatingScenario ? "Simulating..." : "Simulate & Analyze"}
                </button>
              </div>
              <p className="simulator-note">Demo-only: simulated values are stored in the reading history and must not be interpreted as real health measurements.</p>
            </section>

            <section className="section-card">
              <div className="section-header">
                <div>
                  <h2>
                    Health Anomaly Analysis
                  </h2>

                  <p>
                    Compare the latest reading with
                    the member's personal baseline.
                  </p>
                </div>

                <button
                  type="button"
                  className="primary-button"
                  onClick={analyzeAnomalies}
                  disabled={
                    analyzingAnomalies ||
                    !latestReading ||
                    !baseline
                  }
                >
                  {analyzingAnomalies
                    ? "Analyzing..."
                    : "Analyze Health Anomalies"}
                </button>
              </div>

              {anomalyAnalysis ? (
                <div className="anomaly-result">
                  <div className="anomaly-summary">
                    <span>
                      Overall Status
                    </span>

                    <strong
                      className={getStatusClass(
                        anomalyAnalysis.overallStatus ||
                          anomalyAnalysis.status
                      )}
                    >
                      {getStatusLabel(
                        anomalyAnalysis.overallStatus ||
                          anomalyAnalysis.status
                      )}
                    </strong>
                  </div>

                  {anomalyAnalysis.message && (
                    <p className="anomaly-message">
                      {anomalyAnalysis.message}
                    </p>
                  )}

                  {anomalyAnalysis.anomalies &&
                    Array.isArray(
                      anomalyAnalysis.anomalies
                    ) && (
                      <div className="anomaly-list">
                        {anomalyAnalysis.anomalies.map(
                          (
                            anomaly,
                            index
                          ) => (
                            <div
                              className="anomaly-item"
                              key={
                                anomaly._id ||
                                index
                              }
                            >
                              <div>
                                <strong>
                                  {anomaly.vitalType ||
                                    "Vital"}
                                </strong>

                                <p>
                                  {anomaly.message ||
                                    "Anomaly detected."}
                                </p>
                              </div>

                              <span
                                className={`status-badge ${getStatusClass(
                                  anomaly.severity
                                )}`}
                              >
                                {getStatusLabel(
                                  anomaly.severity
                                )}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                </div>
              ) : (
                <div className="empty-state">
                  <h3>
                    No anomaly analysis yet
                  </h3>

                  <p>
                    Calculate a personal baseline
                    first, then analyze the latest
                    reading.
                  </p>
                </div>
              )}
            </section>

            <section className="section-card">
              <div className="section-header">
                <div>
                  <h2>Reading History</h2>

                  <p>
                    Recent vital readings for this
                    family member.
                  </p>
                </div>
              </div>

              {readings.length > 0 ? (
                <div className="table-wrapper">
                  <table className="readings-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Heart Rate</th>
                        <th>SpO₂</th>
                        <th>Temperature</th>
                        <th>Activity</th>
                        <th>Sleep</th>
                        <th>AQI</th>
                        <th>Source</th>
                      </tr>
                    </thead>

                    <tbody>
                      {readings.map(
                        (reading, index) => (
                          <tr
                            key={
                              reading._id ||
                              index
                            }
                          >
                            <td>
                              {formatDate(
                                reading.recordedAt
                              )}
                            </td>

                            <td>
                              {reading.heartRate ??
                                "—"}{" "}
                              BPM
                            </td>

                            <td>
                              {reading.spo2 ??
                                "—"}{" "}
                              %
                            </td>

                            <td>
                              {reading.bodyTemperature ??
                                "—"}{" "}
                              °C
                            </td>

                            <td>
                              {reading.activityMinutes ??
                                "—"}{" "}
                              min
                            </td>

                            <td>
                              {reading.sleepHours ??
                                "—"}{" "}
                              hrs
                            </td>

                            <td>
                              {reading.aqi ??
                                "—"}
                            </td>

                            <td>
                              {reading.source ||
                                "demo"}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <h3>
                    No reading history
                  </h3>

                  <p>
                    Generate health readings to
                    build monitoring history.
                  </p>
                </div>
              )}
            </section>

            <section className="information-card">
              <h2>
                Monitoring Information
              </h2>

              <div className="information-grid">
                <div>
                  <h3>
                    Personalized Monitoring
                  </h3>

                  <p>
                    The system uses available readings
                    to establish an individual health
                    baseline instead of relying only on
                    generic thresholds.
                  </p>
                </div>

                <div>
                  <h3>
                    Environmental Awareness
                  </h3>

                  <p>
                    Temperature, humidity, and air
                    quality can be combined with vital
                    readings to provide contextual
                    early-warning indicators.
                  </p>
                </div>

                <div>
                  <h3>
                    Privacy
                  </h3>

                  <p>
                    Environmental information is
                    requested only when the user
                    chooses to fetch live environmental
                    data and grants location permission.
                  </p>
                </div>

                <div>
                  <h3>
                    Health Safety
                  </h3>

                  <p>
                    Monitoring and risk indicators are
                    informational and are not a
                    substitute for professional medical
                    diagnosis or emergency care.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      <style>{`
        .simulator-controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .simulator-controls select { min-width: 240px; padding: 11px 14px; border: 1px solid #e5e4e7; border-radius: 10px; background: white; color: #08060d; }
        .simulator-note { margin-top: 12px; color: #6b6375; font-size: 13px; }

        .health-monitor-page {
          padding: 28px;
          max-width: 1500px;
          margin: 0 auto;
          color: #08060d;
        }

        .page-header {
          margin-bottom: 24px;
        }

        .page-header h1 {
          margin: 0 0 8px;
          font-size: 32px;
          font-weight: 700;
        }

        .page-header p {
          margin: 0;
          color: #6b6375;
          font-size: 15px;
        }

        .alert {
          padding: 14px 16px;
          border-radius: 14px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .alert-error {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          color: #9f1239;
        }

        .alert-success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        .control-card,
        .section-card,
        .information-card {
          background: #ffffff;
          border: 1px solid #e5e4e7;
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow:
            0 8px 30px rgba(15, 23, 42, 0.05);
        }

        .control-content,
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .section-header {
          margin-bottom: 22px;
        }

        .section-header h2,
        .control-content h2,
        .information-card h2 {
          margin: 0 0 6px;
          font-size: 20px;
        }

        .section-header p,
        .control-content p {
          margin: 0;
          color: #6b6375;
          font-size: 14px;
        }

        select {
          min-width: 260px;
          padding: 12px 14px;
          border: 1px solid #e5e4e7;
          border-radius: 12px;
          background: #ffffff;
          color: #08060d;
          font-size: 14px;
          outline: none;
        }

        button {
          border: none;
          border-radius: 12px;
          padding: 11px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition:
            transform 0.15s ease,
            opacity 0.15s ease;
        }

        button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .primary-button {
          background: #aa3bff;
          color: #ffffff;
        }

        .secondary-button {
          background: rgba(170, 59, 255, 0.1);
          color: #7e22ce;
          border: 1px solid rgba(170, 59, 255, 0.5);
        }

        .vitals-grid,
        .environment-grid,
        .baseline-grid,
        .risk-analysis-grid,
        .information-grid {
          display: grid;
          gap: 16px;
        }

        .vitals-grid {
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
        }

        .environment-grid {
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
        }

        .baseline-grid {
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
        }

        .risk-analysis-grid {
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
        }

        .information-grid {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }

        .vital-card,
        .environment-card,
        .baseline-card,
        .risk-analysis-card {
          background: #ffffff;
          border: 1px solid #e5e4e7;
          border-radius: 16px;
          padding: 18px;
          box-shadow:
            0 5px 20px rgba(15, 23, 42, 0.04);
        }

        .vital-label,
        .environment-card span,
        .baseline-card h3,
        .baseline-summary span,
        .risk-score span {
          display: block;
          color: #6b6375;
          font-size: 13px;
        }

        .vital-value {
          display: inline-block;
          margin-top: 8px;
          font-size: 28px;
          font-weight: 700;
        }

        .vital-unit {
          margin-left: 5px;
          color: #6b6375;
          font-size: 13px;
        }

        .environment-card strong {
          display: block;
          margin-top: 9px;
          font-size: 24px;
        }

        .environment-action {
          display: flex;
          justify-content: flex-end;
          margin-top: 18px;
        }

        .baseline-summary {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 18px;
        }

        .baseline-summary > div {
          padding: 16px;
          border-radius: 14px;
          background: #fafafa;
          border: 1px solid #e5e4e7;
        }

        .baseline-summary strong {
          display: block;
          margin-top: 7px;
          font-size: 16px;
        }

        .baseline-card h3 {
          margin: 0 0 10px;
          font-size: 14px;
          font-weight: 600;
        }

        .baseline-value {
          font-size: 22px;
          font-weight: 700;
        }

        .baseline-details {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 12px;
          margin-top: 10px;
          color: #6b6375;
          font-size: 12px;
        }

        .risk-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .risk-card-header h3 {
          margin: 0;
          font-size: 16px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .status-normal {
          background: #ecfdf5;
          color: #047857;
        }

        .status-warning {
          background: #fffbeb;
          color: #b45309;
        }

        .status-critical {
          background: #fff1f2;
          color: #be123c;
        }

        .risk-score {
          margin-top: 18px;
          display: flex;
          align-items: baseline;
          gap: 10px;
        }

        .risk-score strong {
          font-size: 28px;
        }

        .risk-message,
        .anomaly-message {
          color: #475569;
          line-height: 1.6;
          font-size: 14px;
        }

        .risk-factors {
          margin-top: 18px;
        }

        .risk-factors h4 {
          margin: 0 0 8px;
          font-size: 13px;
        }

        .risk-factors ul {
          margin: 0;
          padding-left: 20px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.7;
        }

        .disclaimer {
          margin-top: 20px;
          padding: 14px 16px;
          border-radius: 14px;
          background: #fafafa;
          border: 1px solid #e5e4e7;
          color: #64748b;
          font-size: 13px;
          line-height: 1.6;
        }

        .anomaly-result {
          padding: 18px;
          border-radius: 16px;
          background: #fafafa;
          border: 1px solid #e5e4e7;
        }

        .anomaly-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .anomaly-summary span {
          color: #64748b;
          font-size: 14px;
        }

        .anomaly-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 18px;
        }

        .anomaly-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 14px;
          background: #ffffff;
          border: 1px solid #e5e4e7;
          border-radius: 12px;
        }

        .anomaly-item strong {
          font-size: 14px;
        }

        .anomaly-item p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .readings-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 900px;
        }

        .readings-table th,
        .readings-table td {
          padding: 13px 12px;
          border-bottom: 1px solid #e5e4e7;
          text-align: left;
          font-size: 13px;
          white-space: nowrap;
        }

        .readings-table th {
          color: #475569;
          font-weight: 700;
          background: #fafafa;
        }

        .readings-table td {
          color: #334155;
        }

        .last-updated {
          margin: 16px 0 0;
          color: #64748b;
          font-size: 12px;
        }

        .empty-state {
          padding: 30px 20px;
          text-align: center;
          border: 1px dashed #d9d6de;
          border-radius: 16px;
          background: #fafafa;
        }

        .empty-state h3 {
          margin: 0 0 7px;
          font-size: 16px;
        }

        .empty-state p {
          margin: 0;
          color: #6b6375;
          font-size: 13px;
        }

        .information-grid > div {
          padding: 18px;
          border: 1px solid #e5e4e7;
          border-radius: 15px;
          background: #fafafa;
        }

        .information-grid h3 {
          margin: 0 0 7px;
          font-size: 15px;
        }

        .information-grid p {
          margin: 0;
          color: #64748b;
          line-height: 1.6;
          font-size: 13px;
        }

        @media (max-width: 1100px) {
          .vitals-grid,
          .environment-grid,
          .baseline-grid,
          .risk-analysis-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .health-monitor-page {
            padding: 18px;
          }

          .control-content,
          .section-header {
            flex-direction: column;
            align-items: stretch;
          }

          select {
            width: 100%;
            min-width: 0;
          }

          .vitals-grid,
          .environment-grid,
          .baseline-grid,
          .risk-analysis-grid,
          .information-grid,
          .baseline-summary {
            grid-template-columns: 1fr;
          }

          .environment-action {
            justify-content: stretch;
          }

          .environment-action button {
            width: 100%;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default HealthMonitor;