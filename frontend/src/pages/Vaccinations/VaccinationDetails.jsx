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

import "./AddVaccination.css";

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

function getMemberName(vaccination) {
  if (
    vaccination?.memberId &&
    typeof vaccination.memberId === "object"
  ) {
    return (
      vaccination.memberId.fullName ||
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

function VaccinationDetails() {
  const navigate = useNavigate();

  const {
    vaccinationId,
  } = useParams();

  const {
    token,
    canModifyInformation,
    signOut,
  } = useAuth();

  const [
    vaccination,
    setVaccination,
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

    async function loadVaccination() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const result = await apiRequest(
          `/vaccinations/${vaccinationId}`,
          {
            token,
          },
        );

        if (!componentIsActive) {
          return;
        }

        setVaccination(
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
            : "Unable to load vaccination record.",
        );
      } finally {
        if (componentIsActive) {
          setIsLoading(false);
        }
      }
    }

    loadVaccination();

    return () => {
      componentIsActive = false;
    };
  }, [
    vaccinationId,
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
        "Are you sure you want to delete this vaccination record? This action cannot be undone.",
      );

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");

    try {
      await apiRequest(
        `/vaccinations/${vaccinationId}`,
        {
          method: "DELETE",
          token,
        },
      );

      navigate(
        "/vaccinations",
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
          : "Unable to delete vaccination record.",
      );

      setIsDeleting(false);
    }
  }

  return (
    <DashboardLayout>
      <section className="vaccination-details-header">
        <div>
          <button
            type="button"
            className="add-vaccination-back-link"
            onClick={() =>
              navigate("/vaccinations")
            }
          >
            ← Vaccinations
          </button>

          <h2>
            Vaccination Details
          </h2>

          <p>
            Review the complete immunization
            record.
          </p>
        </div>

        {vaccination && (
          <span
            className={`vaccination-details-status ${getStatusClass(
              vaccination.status,
            )}`}
          >
            {vaccination.status ||
              "Completed"}
          </span>
        )}
      </section>

      {errorMessage && (
        <div
          className="add-vaccination-error"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {isLoading && (
        <section className="vaccination-details-state">
          <span className="vaccinations-loader" />

          <strong>
            Loading vaccination...
          </strong>
        </section>
      )}

      {!isLoading &&
        !vaccination &&
        !errorMessage && (
          <section className="vaccination-details-state">
            <span
              className="vaccination-details-empty-icon"
              aria-hidden="true"
            >
              💉
            </span>

            <strong>
              Vaccination record not found
            </strong>

            <button
              type="button"
              className="vaccination-details-back-button"
              onClick={() =>
                navigate("/vaccinations")
              }
            >
              Return to Vaccinations
            </button>
          </section>
        )}

      {!isLoading &&
        vaccination && (
          <>
            <section className="vaccination-details-card">
              <div className="add-vaccination-section-heading">
                <span>01</span>

                <div>
                  <h3>
                    Vaccine information
                  </h3>

                  <p>
                    Main vaccination record
                    details.
                  </p>
                </div>
              </div>

              <div className="add-vaccination-divider" />

              <div className="vaccination-details-grid">
                <div className="vaccination-detail-item">
                  <span>
                    Family member
                  </span>

                  <strong>
                    {getMemberName(
                      vaccination,
                    )}
                  </strong>
                </div>

                <div className="vaccination-detail-item">
                  <span>
                    Vaccine name
                  </span>

                  <strong>
                    {vaccination.vaccineName ||
                      "Not available"}
                  </strong>
                </div>

                <div className="vaccination-detail-item">
                  <span>Dose</span>

                  <strong>
                    {vaccination.dose ||
                      "Not specified"}
                  </strong>
                </div>

                <div className="vaccination-detail-item">
                  <span>
                    Vaccination date
                  </span>

                  <strong>
                    {formatDate(
                      vaccination.vaccinationDate,
                    )}
                  </strong>
                </div>

                <div className="vaccination-detail-item">
                  <span>
                    Next due date
                  </span>

                  <strong>
                    {formatDate(
                      vaccination.nextDueDate,
                    )}
                  </strong>
                </div>

                <div className="vaccination-detail-item">
                  <span>Status</span>

                  <strong>
                    {vaccination.status ||
                      "Completed"}
                  </strong>
                </div>

                <div className="vaccination-detail-item">
                  <span>Added on</span>

                  <strong>
                    {formatDate(
                      vaccination.createdAt,
                    )}
                  </strong>
                </div>
              </div>
            </section>

            <section className="vaccination-details-card">
              <div className="add-vaccination-section-heading">
                <span>02</span>

                <div>
                  <h3>Notes</h3>

                  <p>
                    Additional vaccination
                    information.
                  </p>
                </div>
              </div>

              <div className="add-vaccination-divider" />

              <p className="vaccination-details-notes">
                {vaccination.notes ||
                  "No additional notes were added for this vaccination."}
              </p>
            </section>

            <section className="vaccination-details-actions">
              <button
                type="button"
                className="vaccination-details-back-button"
                onClick={() =>
                  navigate(
                    "/vaccinations",
                  )
                }
                disabled={isDeleting}
              >
                Back to Vaccinations
              </button>

              {canModifyInformation && (
                <div className="vaccination-details-manager-actions">
                  <button
                    type="button"
                    className="vaccination-details-edit-button"
                    onClick={() =>
                      navigate(
                        `/vaccinations/${vaccinationId}/edit`,
                      )
                    }
                    disabled={isDeleting}
                  >
                    Edit Vaccination
                  </button>

                  <button
                    type="button"
                    className="vaccination-details-delete-button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting
                      ? "Deleting..."
                      : "Delete Vaccination"}
                  </button>
                </div>
              )}
            </section>
          </>
        )}
    </DashboardLayout>
  );
}

export default VaccinationDetails;