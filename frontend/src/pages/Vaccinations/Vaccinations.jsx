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

import "./Vaccinations.css";

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

function Vaccinations() {
  const navigate = useNavigate();

  const {
    token,
    canModifyInformation,
    signOut,
  } = useAuth();

  const [
    vaccinations,
    setVaccinations,
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
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    let componentIsActive = true;

    async function loadVaccinations() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const result = await apiRequest(
          "/vaccinations",
          {
            token,
          },
        );

        if (!componentIsActive) {
          return;
        }

        setVaccinations(
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
            : "Unable to load vaccination records.",
        );
      } finally {
        if (componentIsActive) {
          setIsLoading(false);
        }
      }
    }

    loadVaccinations();

    return () => {
      componentIsActive = false;
    };
  }, [
    token,
    signOut,
    navigate,
  ]);

  const filteredVaccinations =
    useMemo(() => {
      const query = searchText
        .trim()
        .toLowerCase();

      return vaccinations.filter(
        (vaccination) => {
          const matchesStatus =
            statusFilter === "All" ||
            vaccination.status ===
              statusFilter;

          const searchableText = [
            getMemberName(vaccination),
            vaccination.vaccineName,
            vaccination.dose,
            vaccination.status,
            vaccination.notes,
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
            matchesSearch
          );
        },
      );
    }, [
      vaccinations,
      searchText,
      statusFilter,
    ]);

  return (
    <DashboardLayout>
      <section className="vaccinations-page-header">
        <div>
          <span className="dashboard-section-label">
            IMMUNIZATION RECORDS
          </span>

          <h2>Vaccinations</h2>

          <p>
            Track completed, upcoming and missed
            vaccinations for your family.
          </p>
        </div>

        {canModifyInformation ? (
          <button
            type="button"
            className="vaccinations-primary-button"
            onClick={() =>
              navigate(
                "/vaccinations/add",
              )
            }
          >
            <span aria-hidden="true">
              +
            </span>

            Add Vaccination
          </button>
        ) : (
          <span className="vaccinations-view-only-badge">
            View-only access
          </span>
        )}
      </section>

      <section className="vaccinations-toolbar">
        <div className="vaccinations-search-field">
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
            placeholder="Search member, vaccine, dose or status"
            aria-label="Search vaccinations"
          />
        </div>

        <select
          className="vaccinations-filter"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value,
            )
          }
          aria-label="Filter vaccination status"
        >
          <option value="All">
            All statuses
          </option>

          <option value="Completed">
            Completed
          </option>

          <option value="Upcoming">
            Upcoming
          </option>

          <option value="Missed">
            Missed
          </option>
        </select>

        <span className="vaccinations-count">
          {filteredVaccinations.length}{" "}
          {filteredVaccinations.length === 1
            ? "record"
            : "records"}
        </span>
      </section>

      {errorMessage && (
        <div
          className="vaccinations-error-message"
          role="alert"
        >
          <div>
            <strong>
              Vaccinations could not be loaded
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

      <section className="vaccinations-list-card">
        {isLoading && (
          <div className="vaccinations-page-state">
            <span className="vaccinations-loader" />

            <strong>
              Loading vaccinations...
            </strong>
          </div>
        )}

        {!isLoading &&
          filteredVaccinations.length ===
            0 && (
            <div className="vaccinations-page-state">
              <span
                className="vaccinations-empty-icon"
                aria-hidden="true"
              >
                💉
              </span>

              <strong>
                {searchText ||
                statusFilter !== "All"
                  ? "No matching vaccination"
                  : "No vaccination records yet"}
              </strong>

              <p>
                {searchText ||
                statusFilter !== "All"
                  ? "Try changing the search or status filter."
                  : "Vaccination records will appear here after they are added."}
              </p>

              {!searchText &&
                statusFilter === "All" &&
                canModifyInformation && (
                  <button
                    type="button"
                    className="vaccinations-empty-button"
                    onClick={() =>
                      navigate(
                        "/vaccinations/add",
                      )
                    }
                  >
                    Add first vaccination
                  </button>
                )}
            </div>
          )}

        {!isLoading &&
          filteredVaccinations.length >
            0 && (
            <div className="vaccinations-table-wrapper">
              <table className="vaccinations-table">
                <thead>
                  <tr>
                    <th>Family Member</th>
                    <th>Vaccine</th>
                    <th>Dose</th>
                    <th>Vaccination Date</th>
                    <th>Next Due Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredVaccinations.map(
                    (vaccination) => {
                      const memberName =
                        getMemberName(
                          vaccination,
                        );

                      return (
                        <tr
                          key={
                            vaccination._id
                          }
                        >
                          <td>
                            <div className="vaccinations-person">
                              <span className="vaccinations-avatar">
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
                            <strong className="vaccinations-vaccine-name">
                              {vaccination.vaccineName}
                            </strong>
                          </td>

                          <td>
                            {vaccination.dose ||
                              "Not specified"}
                          </td>

                          <td>
                            {formatDate(
                              vaccination.vaccinationDate,
                            )}
                          </td>

                          <td>
                            {formatDate(
                              vaccination.nextDueDate,
                            )}
                          </td>

                          <td>
                            <span
                              className={`vaccinations-status ${getStatusClass(
                                vaccination.status,
                              )}`}
                            >
                              {vaccination.status ||
                                "Completed"}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="vaccinations-view-button"
                              onClick={() =>
                                navigate(
                                  `/vaccinations/${vaccination._id}`,
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

export default Vaccinations;