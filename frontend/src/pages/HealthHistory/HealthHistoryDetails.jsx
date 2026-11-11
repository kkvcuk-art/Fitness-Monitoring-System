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

import "./AddHealthHistory.css";

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
      month: "long",
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

function getStatusClass(status = "") {
  return String(status)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function HealthHistoryDetails() {
  const navigate = useNavigate();

  const {
    historyId,
  } = useParams();

  const {
    token,
    canModifyInformation,
    signOut,
  } = useAuth();

  const [
    record,
    setRecord,
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

    async function loadRecord() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const result = await apiRequest(
          `/health-history/${historyId}`,
          {
            token,
          },
        );

        if (!componentIsActive) {
          return;
        }

        setRecord(
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
            : "Unable to load health-history record.",
        );
      } finally {
        if (componentIsActive) {
          setIsLoading(false);
        }
      }
    }

    loadRecord();

    return () => {
      componentIsActive = false;
    };
  }, [
    historyId,
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
        "Are you sure you want to delete this health-history record? This action cannot be undone.",
      );

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");

    try {
      await apiRequest(
        `/health-history/${historyId}`,
        {
          method: "DELETE",
          token,
        },
      );

      navigate(
        "/health-history",
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
          : "Unable to delete health-history record.",
      );

      setIsDeleting(false);
    }
  }

  return (
    <DashboardLayout>
      <section className="history-details-header">
        <div>
          <button
            type="button"
            className="add-history-back-link"
            onClick={() =>
              navigate("/health-history")
            }
          >
            ← Health History
          </button>

          <h2>
            Health Record Details
          </h2>

          <p>
            Review the complete condition,
            treatment and hereditary
            information.
          </p>
        </div>

        {record && (
          <span
            className={`history-details-status ${getStatusClass(
              record.status,
            )}`}
          >
            {record.status || "Unknown"}
          </span>
        )}
      </section>

      {errorMessage && (
        <div
          className="add-history-error"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {isLoading && (
        <section className="history-details-state">
          <span className="history-loader" />

          <strong>
            Loading health record...
          </strong>
        </section>
      )}

      {!isLoading &&
        !record &&
        !errorMessage && (
          <section className="history-details-state">
            <span
              className="history-details-empty-icon"
              aria-hidden="true"
            >
              🩺
            </span>

            <strong>
              Health-history record not found
            </strong>

            <button
              type="button"
              className="history-details-back-button"
              onClick={() =>
                navigate(
                  "/health-history",
                )
              }
            >
              Return to Health History
            </button>
          </section>
        )}

      {!isLoading && record && (
        <>
          <section className="history-details-card">
            <div className="add-history-section-heading">
              <span>01</span>

              <div>
                <h3>
                  Condition information
                </h3>

                <p>
                  Main health-history details.
                </p>
              </div>
            </div>

            <div className="add-history-divider" />

            <div className="history-details-grid">
              <div className="history-detail-item">
                <span>
                  Family member
                </span>

                <strong>
                  {getMemberName(record)}
                </strong>
              </div>

              <div className="history-detail-item">
                <span>
                  Disease or condition
                </span>

                <strong>
                  {record.conditionName ||
                    "Not available"}
                </strong>
              </div>

              <div className="history-detail-item">
                <span>
                  Diagnosis date
                </span>

                <strong>
                  {formatDate(
                    record.diagnosisDate,
                  )}
                </strong>
              </div>

              <div className="history-detail-item">
                <span>
                  Current status
                </span>

                <strong>
                  {record.status ||
                    "Unknown"}
                </strong>
              </div>

              <div className="history-detail-item">
                <span>
                  Hereditary
                </span>

                <strong
                  className={
                    record.hereditary
                      ? "hereditary-yes"
                      : ""
                  }
                >
                  {record.hereditary
                    ? "Yes — may run in family"
                    : "No"}
                </strong>
              </div>

              <div className="history-detail-item">
                <span>Added on</span>

                <strong>
                  {formatDate(
                    record.createdAt,
                  )}
                </strong>
              </div>
            </div>
          </section>

          <section className="history-details-card">
            <div className="add-history-section-heading">
              <span>02</span>

              <div>
                <h3>
                  Treatment and care
                </h3>

                <p>
                  Doctor, hospital and
                  treatment information.
                </p>
              </div>
            </div>

            <div className="add-history-divider" />

            <div className="history-details-grid">
              <div className="history-detail-item">
                <span>
                  Doctor name
                </span>

                <strong>
                  {record.doctorName ||
                    "Not specified"}
                </strong>
              </div>

              <div className="history-detail-item">
                <span>
                  Hospital or clinic
                </span>

                <strong>
                  {record.hospitalName ||
                    "Not specified"}
                </strong>
              </div>
            </div>

            <div className="add-history-divider" />

            <div>
              <div className="history-details-text">
                <strong>Treatment</strong>

                <br />

                {record.treatment ||
                  "No treatment information was added."}
              </div>

              <div className="history-details-text">
                <strong>
                  Additional notes
                </strong>

                <br />

                {record.notes ||
                  "No additional notes were added."}
              </div>
            </div>
          </section>

          <section className="history-details-actions">
            <button
              type="button"
              className="history-details-back-button"
              onClick={() =>
                navigate(
                  "/health-history",
                )
              }
              disabled={isDeleting}
            >
              Back to Health History
            </button>

            {canModifyInformation && (
              <div className="history-details-manager-actions">
                <button
                  type="button"
                  className="history-details-edit-button"
                  onClick={() =>
                    navigate(
                      `/health-history/${historyId}/edit`,
                    )
                  }
                  disabled={isDeleting}
                >
                  Edit Health Record
                </button>

                <button
                  type="button"
                  className="history-details-delete-button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting
                    ? "Deleting..."
                    : "Delete Health Record"}
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

export default HealthHistoryDetails;