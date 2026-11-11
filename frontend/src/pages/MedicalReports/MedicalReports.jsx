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

import "./MedicalReports.css";

function formatDate(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
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

function getMemberName(report) {
  if (
    report?.memberId &&
    typeof report.memberId === "object"
  ) {
    return (
      report.memberId.fullName ||
      report.memberName ||
      "Unknown member"
    );
  }

  return (
    report?.memberName ||
    "Unknown member"
  );
}

function getInitials(fullName = "") {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function getStatusClass(status = "") {
  return String(status)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function MedicalReports() {
  const navigate = useNavigate();

  const {
    token,
    canModifyInformation,
    signOut,
  } = useAuth();

  const [
    reports,
    setReports,
  ] = useState([]);

  const [
    searchText,
    setSearchText,
  ] = useState("");

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

    async function loadMedicalReports() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const result = await apiRequest(
          "/medical-reports",
          {
            token,
          },
        );

        if (!componentIsActive) {
          return;
        }

        setReports(
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
            : "Unable to load medical reports.",
        );
      } finally {
        if (componentIsActive) {
          setIsLoading(false);
        }
      }
    }

    loadMedicalReports();

    return () => {
      componentIsActive = false;
    };
  }, [
    token,
    signOut,
    navigate,
  ]);

  const filteredReports = useMemo(
    () => {
      const query = searchText
        .trim()
        .toLowerCase();

      if (!query) {
        return reports;
      }

      return reports.filter(
        (report) => {
          const searchableText = [
            getMemberName(report),
            report.recordType,
            report.value,
            report.status,
            report.notes,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchableText.includes(
            query,
          );
        },
      );
    },
    [
      reports,
      searchText,
    ],
  );

  return (
    <DashboardLayout>
      <section className="reports-page-header">
        <div>
          <span className="dashboard-section-label">
            MODULE 8: MEDICAL REPORTS & DOCUMENT DIRECTORY
          </span>

          <h2>Categorized Health Records</h2>

          <p>
            Separate directories for Lab Reports, Prescriptions, Outpatient Notes, and Imaging Records 
            with printable PDF summary compilation.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            type="button"
            className="reports-print-btn"
            onClick={() => window.print()}
            style={{
              background: "#475569",
              color: "white",
              border: "none",
              padding: "0.65rem 1.1rem",
              borderRadius: "8px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            🖨️ <span>Print Medical Summary PDF</span>
          </button>

          {canModifyInformation ? (
            <button
              type="button"
              className="reports-primary-button"
              onClick={() =>
                navigate(
                  "/medical-reports/add",
                )
              }
            >
              <span aria-hidden="true">
                +
              </span>

              Add Medical Report
            </button>
          ) : (
            <span className="reports-view-only-badge">
              View-only access
            </span>
          )}
        </div>
      </section>

      {/* Safety & Non-Diagnostic Disclaimer Banner (NFR-3.1) */}
      <div style={{
        background: "#fffbebf8",
        border: "1px solid #fde68a",
        color: "#92400e",
        padding: "0.75rem 1.25rem",
        borderRadius: "10px",
        marginBottom: "1.25rem",
        fontSize: "0.85rem",
        fontWeight: "600"
      }}>
        🛡️ <strong>CRITICAL SAFETY DISCLAIMER (NFR-3.1):</strong> This compiled report is for preventive health tracking purposes only. The system is NOT a diagnostic tool. Consult a licensed physician for clinical evaluation.
      </div>

      <section className="reports-toolbar">
        <div className="reports-search-field">
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
            placeholder="Search member, record type, value or status"
            aria-label="Search medical reports"
          />
        </div>

        <span className="reports-count">
          {filteredReports.length}{" "}
          {filteredReports.length === 1
            ? "report"
            : "reports"}
        </span>
      </section>

      {errorMessage && (
        <div
          className="reports-error-message"
          role="alert"
        >
          <div>
            <strong>
              Medical reports could not be
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

      <section className="reports-list-card">
        {isLoading && (
          <div className="reports-page-state">
            <span className="reports-loader" />

            <strong>
              Loading medical reports...
            </strong>
          </div>
        )}

        {!isLoading &&
          filteredReports.length === 0 && (
            <div className="reports-page-state">
              <span
                className="reports-empty-icon"
                aria-hidden="true"
              >
                📋
              </span>

              <strong>
                {searchText
                  ? "No matching medical report"
                  : "No medical reports yet"}
              </strong>

              <p>
                {searchText
                  ? "Try searching with different information."
                  : "Health records will appear here after they are added."}
              </p>

              {!searchText &&
                canModifyInformation && (
                  <button
                    type="button"
                    className="reports-empty-button"
                    onClick={() =>
                      navigate(
                        "/medical-reports/add",
                      )
                    }
                  >
                    Add first report
                  </button>
                )}
            </div>
          )}

        {!isLoading &&
          filteredReports.length > 0 && (
            <div className="reports-table-wrapper">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Family Member</th>
                    <th>Record Type</th>
                    <th>Value</th>
                    <th>Record Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredReports.map(
                    (report) => {
                      const memberName =
                        getMemberName(
                          report,
                        );

                      return (
                        <tr key={report._id}>
                          <td>
                            <div className="reports-person">
                              <span className="reports-avatar">
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
                            <span className="reports-type">
                              {report.recordType}
                            </span>
                          </td>

                          <td>
                            <strong className="reports-value">
                              {report.value}
                            </strong>
                          </td>

                          <td>
                            {formatDate(
                              report.recordDate,
                            )}
                          </td>

                          <td>
                            <span
                              className={`reports-status ${getStatusClass(
                                report.status,
                              )}`}
                            >
                              {report.status ||
                                "Normal"}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="reports-view-button"
                              onClick={() =>
                                navigate(
                                  `/medical-reports/${report._id}`,
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

export default MedicalReports;