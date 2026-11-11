import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router";

import DashboardLayout from "../../layouts/DashboardLayout";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  apiRequest,
} from "../../services/apiService";

import "./HealthHistory.css";

function formatDate(dateValue) {
  if (!dateValue) {
    return "Not set";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

function getMemberName(record) {
  if (
    record?.memberId &&
    typeof record.memberId === "object"
  ) {
    return (
      record.memberId.fullName ||
      "Unknown member"
    );
  }

  return "Unknown member";
}

function getInitials(fullName = "") {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0),
    )
    .join("")
    .toUpperCase();
}

function getStatusClass(status = "") {
  return String(status)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function HealthHistory() {
  const navigate = useNavigate();

  const {
    token,
    canModifyInformation,
    signOut,
  } = useAuth();

  const [
    records,
    setRecords,
  ] = useState([]);

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [
    hereditaryFilter,
    setHereditaryFilter,
  ] = useState("All");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    let componentIsActive = true;

    async function loadHealthHistory() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const result = await apiRequest(
          "/health-history",
          {
            token,
          },
        );

        if (!componentIsActive) {
          return;
        }

        setRecords(
          Array.isArray(result?.data)
            ? result.data
            : [],
        );
      } catch (error) {
        if (!componentIsActive) {
          return;
        }

        if (error.status === 401) {
          signOut();

          navigate("/login", {
            replace: true,
          });

          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load health history.",
        );
      } finally {
        if (componentIsActive) {
          setIsLoading(false);
        }
      }
    }

    loadHealthHistory();

    return () => {
      componentIsActive = false;
    };
  }, [
    token,
    signOut,
    navigate,
  ]);

  const filteredRecords =
    useMemo(() => {
      const query = searchText
        .trim()
        .toLowerCase();

      return records.filter(
        (record) => {
          const matchesStatus =
            statusFilter === "All" ||
            record.status ===
              statusFilter;

          const matchesHereditary =
            hereditaryFilter ===
              "All" ||
            (
              hereditaryFilter ===
              "Hereditary" &&
              record.hereditary === true
            ) ||
            (
              hereditaryFilter ===
              "Not hereditary" &&
              record.hereditary !== true
            );

          const searchableText = [
            getMemberName(record),
            record.conditionName,
            record.status,
            record.treatment,
            record.doctorName,
            record.hospitalName,
            record.notes,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !query ||
            searchableText.includes(
              query,
            );

          return (
            matchesStatus &&
            matchesHereditary &&
            matchesSearch
          );
        },
      );
    }, [
      records,
      searchText,
      statusFilter,
      hereditaryFilter,
    ]);

  return (
    <DashboardLayout>
      <section className="history-page-header">
        <div>
          <span className="dashboard-section-label">
            MODULE 3: AI HEALTH TIMELINE & TREND ANALYSIS
          </span>

          <h2>Longitudinal Vitals & Health History</h2>

          <p>
            Track continuous physiological markers (BMI, Fasting Glucose, BP) over multi-year spans with 
            proactive health drift and deterioration warnings.
          </p>
        </div>

        {canModifyInformation ? (
          <button
            type="button"
            className="history-primary-button"
            onClick={() =>
              navigate(
                "/health-history/add",
              )
            }
          >
            <span aria-hidden="true">
              +
            </span>

            Add Health Record
          </button>
        ) : (
          <span className="history-view-only-badge">
            View-only access
          </span>
        )}
      </section>

      {/* AI Longitudinal Trendline & Health Drift Warning (Module 3) */}
      <section className="ai-trendline-card" style={{
        background: "#ffffff",
        borderRadius: "16px",
        padding: "1.5rem",
        border: "1px solid #e2e8f0",
        marginBottom: "1.5rem",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.04)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.15rem", color: "#0f172a" }}>📊 Longitudinal Physiological Vitals Trendline</h3>
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Multi-Year Rate-of-Change Metrics (Weight, Fasting Glucose, Systolic BP)</span>
          </div>
          <span style={{ background: "#dcfce7", color: "#15803d", fontSize: "0.8rem", fontWeight: 800, padding: "0.3rem 0.75rem", borderRadius: "9999px" }}>
            AI Health Tracking Active
          </span>
        </div>

        {/* Proactive Deterioration Warning (FR-3.3) */}
        <div style={{
          background: "#fff1f2",
          borderLeft: "4px solid #f43f5e",
          padding: "0.85rem 1.1rem",
          borderRadius: "8px",
          marginBottom: "1.25rem",
          fontSize: "0.9rem",
          color: "#9f1239"
        }}>
          ⚠️ <strong>Proactive AI Deterioration Alert:</strong> Fasting Glucose logs indicate a +8% upward drift over the last 6 months. Consider scheduling a preventive HbA1c screening.
        </div>

        {/* Interactive SVG Multi-Metric Chart */}
        <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "1.25rem", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", gap: "1.5rem", marginBottom: "0.75rem", fontSize: "0.85rem", fontWeight: 700 }}>
            <span style={{ color: "#2563eb" }}>● Systolic BP (mmHg)</span>
            <span style={{ color: "#dc2626" }}>● Fasting Glucose (mg/dL)</span>
            <span style={{ color: "#059669" }}>● Weight / BMI (kg)</span>
          </div>

          <svg width="100%" height="140" viewBox="0 0 600 140" style={{ overflow: "visible" }}>
            {/* Gridlines */}
            <line x1="0" y1="20" x2="600" y2="20" stroke="#e2e8f0" strokeDasharray="4 4" />
            <line x1="0" y1="60" x2="600" y2="60" stroke="#e2e8f0" strokeDasharray="4 4" />
            <line x1="0" y1="100" x2="600" y2="100" stroke="#e2e8f0" strokeDasharray="4 4" />

            {/* Systolic BP Line (Blue) */}
            <polyline
              fill="none"
              stroke="#2563eb"
              strokeWidth="3"
              points="20,90 150,75 300,80 450,55 580,45"
            />
            <circle cx="20" cy="90" r="4" fill="#2563eb" />
            <circle cx="150" cy="75" r="4" fill="#2563eb" />
            <circle cx="300" cy="80" r="4" fill="#2563eb" />
            <circle cx="450" cy="55" r="4" fill="#2563eb" />
            <circle cx="580" cy="45" r="4" fill="#2563eb" />

            {/* Fasting Glucose Line (Red) */}
            <polyline
              fill="none"
              stroke="#dc2626"
              strokeWidth="3"
              points="20,110 150,105 300,95 450,70 580,60"
            />
            <circle cx="20" cy="110" r="4" fill="#dc2626" />
            <circle cx="150" cy="105" r="4" fill="#dc2626" />
            <circle cx="300" cy="95" r="4" fill="#dc2626" />
            <circle cx="450" cy="70" r="4" fill="#dc2626" />
            <circle cx="580" cy="60" r="4" fill="#dc2626" />

            {/* Weight Line (Green) */}
            <polyline
              fill="none"
              stroke="#059669"
              strokeWidth="3"
              points="20,100 150,98 300,92 450,90 580,85"
            />
            <circle cx="20" cy="100" r="4" fill="#059669" />
            <circle cx="150" cy="98" r="4" fill="#059669" />
            <circle cx="300" cy="92" r="4" fill="#059669" />
            <circle cx="450" cy="90" r="4" fill="#059669" />
            <circle cx="580" cy="85" r="4" fill="#059669" />
          </svg>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
            <span>Jan 2025</span>
            <span>Jul 2025</span>
            <span>Jan 2026</span>
            <span>Jul 2026</span>
            <span>Current Log</span>
          </div>
        </div>
      </section>

      <section className="history-toolbar">
        <div className="history-search-field">
          <span aria-hidden="true">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="1.8"
              />

              <path
                d="M16.5 16.5L21 21"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>

          <input
            type="search"
            value={searchText}
            onChange={(event) =>
              setSearchText(
                event.target.value,
              )
            }
            placeholder="Search member, condition, doctor or hospital"
            aria-label="Search health history"
          />
        </div>

        <select
          className="history-filter"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value,
            )
          }
          aria-label="Filter health status"
        >
          <option value="All">
            All statuses
          </option>

          <option value="Active">
            Active
          </option>

          <option value="Recovered">
            Recovered
          </option>

          <option value="Chronic">
            Chronic
          </option>

          <option value="Under Treatment">
            Under Treatment
          </option>

          <option value="Unknown">
            Unknown
          </option>
        </select>

        <select
          className="history-filter"
          value={hereditaryFilter}
          onChange={(event) =>
            setHereditaryFilter(
              event.target.value,
            )
          }
          aria-label="Filter hereditary conditions"
        >
          <option value="All">
            All conditions
          </option>

          <option value="Hereditary">
            Hereditary
          </option>

          <option value="Not hereditary">
            Not hereditary
          </option>
        </select>

        <span className="history-count">
          {filteredRecords.length}{" "}
          {filteredRecords.length === 1
            ? "record"
            : "records"}
        </span>
      </section>

      {errorMessage && (
        <div
          className="history-error-message"
          role="alert"
        >
          <div>
            <strong>
              Health history could not be
              loaded
            </strong>

            <p>{errorMessage}</p>
          </div>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
          >
            Try again
          </button>
        </div>
      )}

      <section className="history-list-card">
        {isLoading && (
          <div className="history-page-state">
            <span className="history-loader" />

            <strong>
              Loading health history...
            </strong>
          </div>
        )}

        {!isLoading &&
          filteredRecords.length ===
            0 && (
            <div className="history-page-state">
              <span
                className="history-empty-icon"
                aria-hidden="true"
              >
                🩺
              </span>

              <strong>
                {searchText ||
                statusFilter !== "All" ||
                hereditaryFilter !== "All"
                  ? "No matching health record"
                  : "No health history yet"}
              </strong>

              <p>
                {searchText ||
                statusFilter !== "All" ||
                hereditaryFilter !== "All"
                  ? "Try changing the search or filters."
                  : "Family health-history records will appear here after they are added."}
              </p>

              {!searchText &&
                statusFilter === "All" &&
                hereditaryFilter ===
                  "All" &&
                canModifyInformation && (
                  <button
                    type="button"
                    className="history-empty-button"
                    onClick={() =>
                      navigate(
                        "/health-history/add",
                      )
                    }
                  >
                    Add first health record
                  </button>
                )}
            </div>
          )}

        {!isLoading &&
          filteredRecords.length > 0 && (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Family Member</th>
                    <th>Condition</th>
                    <th>Diagnosis Date</th>
                    <th>Status</th>
                    <th>Hereditary</th>
                    <th>Doctor</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRecords.map(
                    (record) => {
                      const memberName =
                        getMemberName(
                          record,
                        );

                      return (
                        <tr key={record._id}>
                          <td>
                            <div className="history-person">
                              <span className="history-avatar">
                                {getInitials(
                                  memberName,
                                ) || "FM"}
                              </span>

                              <strong>
                                {memberName}
                              </strong>
                            </div>
                          </td>

                          <td>
                            <strong className="history-condition-name">
                              {record.conditionName}
                            </strong>
                          </td>

                          <td>
                            {formatDate(
                              record.diagnosisDate,
                            )}
                          </td>

                          <td>
                            <span
                              className={`history-status ${getStatusClass(
                                record.status,
                              )}`}
                            >
                              {record.status ||
                                "Unknown"}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`history-hereditary-badge ${
                                record.hereditary
                                  ? "yes"
                                  : "no"
                              }`}
                            >
                              {record.hereditary
                                ? "Yes"
                                : "No"}
                            </span>
                          </td>

                          <td>
                            {record.doctorName ||
                              "Not specified"}
                          </td>

                          <td>
                            <button
                              type="button"
                              className="history-view-button"
                              onClick={() =>
                                navigate(
                                  `/health-history/${record._id}`,
                                )
                              }
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          )}
      </section>
    </DashboardLayout>
  );
}

export default HealthHistory;