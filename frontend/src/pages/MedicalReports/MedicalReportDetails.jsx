import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router";

import DashboardLayout from "../../layouts/DashboardLayout";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  apiRequest,
} from "../../services/apiService";

import "./AddMedicalReport.css";

function formatDate(dateValue) {
  if (!dateValue) {
    return "Not available";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "long",
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

function getStatusClass(status = "") {
  return String(status)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function MedicalReportDetails() {
  const navigate = useNavigate();

  const {
    reportId,
  } = useParams();

  const {
    token,
    canModifyInformation,
    signOut,
  } = useAuth();

  const [
    report,
    setReport,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    let componentIsActive = true;

    async function loadReport() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const result = await apiRequest(
          `/medical-reports/${reportId}`,
          {
            token,
          },
        );

        if (!componentIsActive) {
          return;
        }

        setReport(
          result?.data || null,
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
            : "Unable to load medical report.",
        );
      } finally {
        if (componentIsActive) {
          setIsLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      componentIsActive = false;
    };
  }, [
    reportId,
    token,
    signOut,
    navigate,
  ]);

  async function handleDelete() {
    if (!canModifyInformation) {
      return;
    }

    const shouldDelete =
      window.confirm(
        "Are you sure you want to delete this medical report? This action cannot be undone.",
      );

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");

    try {
      await apiRequest(
        `/medical-reports/${reportId}`,
        {
          method: "DELETE",
          token,
        },
      );

      navigate(
        "/medical-reports",
        {
          replace: true,
        },
      );
    } catch (error) {
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
          : "Unable to delete medical report.",
      );

      setIsDeleting(false);
    }
  }

  return (
    <DashboardLayout>
      <section className="report-details-header">
        <div>
          <button
            type="button"
            className="add-report-back-link"
            onClick={() =>
              navigate(
                "/medical-reports",
              )
            }
          >
            ← Medical Reports
          </button>

          <h2>
            Medical Report Details
          </h2>

          <p>
            Review the complete health record
            information.
          </p>
        </div>

        {report && (
          <span
            className={`report-details-status ${getStatusClass(
              report.status,
            )}`}
          >
            {report.status || "Normal"}
          </span>
        )}
      </section>

      {errorMessage && (
        <div
          className="add-report-error"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {isLoading && (
        <section className="report-details-state">
          <span className="reports-loader" />

          <strong>
            Loading medical report...
          </strong>
        </section>
      )}

      {!isLoading &&
        !report &&
        !errorMessage && (
          <section className="report-details-state">
            <span
              className="report-details-empty-icon"
              aria-hidden="true"
            >
              📋
            </span>

            <strong>
              Medical report not found
            </strong>

            <button
              type="button"
              className="report-details-back-button"
              onClick={() =>
                navigate(
                  "/medical-reports",
                )
              }
            >
              Return to Reports
            </button>
          </section>
        )}

      {!isLoading && report && (
        <>
          <section className="report-details-card">
            <div className="add-report-section-heading">
              <span>01</span>

              <div>
                <h3>
                  Health record
                </h3>

                <p>
                  Main medical report
                  information.
                </p>
              </div>
            </div>

            <div className="add-report-divider" />

            <div className="report-details-grid">
              <div className="report-detail-item">
                <span>
                  Family member
                </span>

                <strong>
                  {getMemberName(report)}
                </strong>
              </div>

              <div className="report-detail-item">
                <span>
                  Record type
                </span>

                <strong>
                  {report.recordType ||
                    "Not available"}
                </strong>
              </div>

              <div className="report-detail-item">
                <span>
                  Result or value
                </span>

                <strong>
                  {report.value ||
                    "Not available"}
                </strong>
              </div>

              <div className="report-detail-item">
                <span>
                  Record date
                </span>

                <strong>
                  {formatDate(
                    report.recordDate,
                  )}
                </strong>
              </div>

              <div className="report-detail-item">
                <span>Status</span>

                <strong>
                  {report.status ||
                    "Normal"}
                </strong>
              </div>

              <div className="report-detail-item">
                <span>Added on</span>

                <strong>
                  {formatDate(
                    report.createdAt,
                  )}
                </strong>
              </div>
            </div>
          </section>

          <section className="report-details-card">
            <div className="add-report-section-heading">
              <span>02</span>

              <div>
                <h3>Notes</h3>

                <p>
                  Medical observations and
                  additional information.
                </p>
              </div>
            </div>

            <div className="add-report-divider" />

            <p className="report-details-notes">
              {report.notes ||
                "No additional notes were added for this report."}
            </p>
          </section>

          <section className="report-details-actions">
            <button
              type="button"
              className="report-details-back-button"
              onClick={() =>
                navigate(
                  "/medical-reports",
                )
              }
              disabled={isDeleting}
            >
              Back to Reports
            </button>

            {canModifyInformation && (
              <div className="report-details-manager-actions">
                <button
                  type="button"
                  className="report-details-edit-button"
                  onClick={() =>
                    navigate(
                      `/medical-reports/${reportId}/edit`,
                    )
                  }
                  disabled={isDeleting}
                >
                  Edit Report
                </button>

                <button
                  type="button"
                  className="report-details-delete-button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting
                    ? "Deleting..."
                    : "Delete Report"}
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

export default MedicalReportDetails;