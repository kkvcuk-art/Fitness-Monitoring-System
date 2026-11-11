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

const vaccinationStatuses = [
  "Completed",
  "Upcoming",
  "Missed",
];

const initialFormData = {
  memberId: "",
  vaccineName: "",
  dose: "",
  vaccinationDate: "",
  nextDueDate: "",
  status: "Completed",
  notes: "",
};

function getDateInputValue(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date
    .toISOString()
    .split("T")[0];
}

function getMemberId(vaccination) {
  if (!vaccination?.memberId) {
    return "";
  }

  return typeof vaccination.memberId ===
    "object"
    ? vaccination.memberId._id
    : vaccination.memberId;
}

function EditVaccination() {
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
    members,
    setMembers,
  ] = useState([]);

  const [
    formData,
    setFormData,
  ] = useState(initialFormData);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    let componentIsActive = true;

    async function loadPageData() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [
          vaccinationResult,
          membersResult,
        ] = await Promise.all([
          apiRequest(
            `/vaccinations/${vaccinationId}`,
            {
              token,
            },
          ),

          apiRequest(
            "/members",
            {
              token,
            },
          ),
        ]);

        if (!componentIsActive) {
          return;
        }

        const vaccination =
          vaccinationResult?.data;

        const familyMembers =
          Array.isArray(
            membersResult?.data,
          )
            ? membersResult.data
            : [];

        setMembers(familyMembers);

        if (!vaccination) {
          setErrorMessage(
            "Vaccination record not found.",
          );

          return;
        }

        setFormData({
          memberId:
            getMemberId(vaccination),

          vaccineName:
            vaccination.vaccineName ||
            "",

          dose:
            vaccination.dose || "",

          vaccinationDate:
            getDateInputValue(
              vaccination.vaccinationDate,
            ),

          nextDueDate:
            getDateInputValue(
              vaccination.nextDueDate,
            ),

          status:
            vaccination.status ||
            "Completed",

          notes:
            vaccination.notes || "",
        });
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

    loadPageData();

    return () => {
      componentIsActive = false;
    };
  }, [
    vaccinationId,
    token,
    signOut,
    navigate,
  ]);

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (currentData) => ({
        ...currentData,
        [name]: value,
      }),
    );

    if (errorMessage) {
      setErrorMessage("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canModifyInformation) {
      setErrorMessage(
        "You have view-only access and cannot update vaccination records.",
      );

      return;
    }

    if (
      !formData.memberId ||
      !formData.vaccineName.trim()
    ) {
      setErrorMessage(
        "Family member and vaccine name are required.",
      );

      return;
    }

    if (
      formData.vaccinationDate &&
      formData.nextDueDate &&
      new Date(formData.nextDueDate) <
        new Date(
          formData.vaccinationDate,
        )
    ) {
      setErrorMessage(
        "Next due date cannot be earlier than the vaccination date.",
      );

      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await apiRequest(
        `/vaccinations/${vaccinationId}`,
        {
          method: "PUT",
          token,

          body: {
            memberId:
              formData.memberId,

            vaccineName:
              formData.vaccineName.trim(),

            dose:
              formData.dose.trim(),

            vaccinationDate:
              formData.vaccinationDate,

            nextDueDate:
              formData.nextDueDate,

            status:
              formData.status,

            notes:
              formData.notes.trim(),
          },
        },
      );

      navigate(
        `/vaccinations/${vaccinationId}`,
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
          : "Unable to update vaccination.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardLayout>
      <section className="add-vaccination-page-header">
        <button
          type="button"
          className="add-vaccination-back-link"
          onClick={() =>
            navigate(
              `/vaccinations/${vaccinationId}`,
            )
          }
        >
          ← Vaccination Details
        </button>

        <h2>Edit Vaccination</h2>

        <p>
          Update this family vaccination record
          and save the latest information.
        </p>
      </section>

      {errorMessage && (
        <div
          className="add-vaccination-error"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {!canModifyInformation && (
        <div
          className="add-vaccination-warning"
          role="alert"
        >
          Your account has view-only access.
          Only a Health Manager can edit
          vaccination records.
        </div>
      )}

      {isLoading ? (
        <section className="vaccination-details-state">
          <span className="vaccinations-loader" />

          <strong>
            Loading vaccination...
          </strong>
        </section>
      ) : (
        <form
          className="add-vaccination-form"
          onSubmit={handleSubmit}
        >
          <section className="add-vaccination-card">
            <div className="add-vaccination-section-heading">
              <span>01</span>

              <div>
                <h3>
                  Vaccine information
                </h3>

                <p>
                  Update the member and vaccine
                  details.
                </p>
              </div>
            </div>

            <div className="add-vaccination-divider" />

            <div className="add-vaccination-grid">
              <div className="add-vaccination-field">
                <label htmlFor="memberId">
                  Family member *
                </label>

                <select
                  id="memberId"
                  name="memberId"
                  value={formData.memberId}
                  onChange={handleChange}
                  disabled={
                    isSubmitting ||
                    !canModifyInformation
                  }
                  required
                >
                  <option value="">
                    Select family member
                  </option>

                  {members.map(
                    (member) => (
                      <option
                        value={member._id}
                        key={member._id}
                      >
                        {member.fullName}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="add-vaccination-field">
                <label htmlFor="vaccineName">
                  Vaccine name *
                </label>

                <input
                  type="text"
                  id="vaccineName"
                  name="vaccineName"
                  value={formData.vaccineName}
                  onChange={handleChange}
                  placeholder="Example: COVID-19, Hepatitis B"
                  maxLength="150"
                  disabled={
                    isSubmitting ||
                    !canModifyInformation
                  }
                  required
                />
              </div>

              <div className="add-vaccination-field">
                <label htmlFor="dose">
                  Dose
                </label>

                <input
                  type="text"
                  id="dose"
                  name="dose"
                  value={formData.dose}
                  onChange={handleChange}
                  placeholder="Example: Dose 1, Booster"
                  maxLength="100"
                  disabled={
                    isSubmitting ||
                    !canModifyInformation
                  }
                />
              </div>

              <div className="add-vaccination-field">
                <label htmlFor="status">
                  Status *
                </label>

                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={
                    isSubmitting ||
                    !canModifyInformation
                  }
                  required
                >
                  {vaccinationStatuses.map(
                    (status) => (
                      <option
                        value={status}
                        key={status}
                      >
                        {status}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
          </section>

          <section className="add-vaccination-card">
            <div className="add-vaccination-section-heading">
              <span>02</span>

              <div>
                <h3>
                  Schedule and notes
                </h3>

                <p>
                  Update dates and additional
                  information.
                </p>
              </div>
            </div>

            <div className="add-vaccination-divider" />

            <div className="add-vaccination-grid">
              <div className="add-vaccination-field">
                <label htmlFor="vaccinationDate">
                  Vaccination date
                </label>

                <input
                  type="date"
                  id="vaccinationDate"
                  name="vaccinationDate"
                  value={
                    formData.vaccinationDate
                  }
                  onChange={handleChange}
                  disabled={
                    isSubmitting ||
                    !canModifyInformation
                  }
                />
              </div>

              <div className="add-vaccination-field">
                <label htmlFor="nextDueDate">
                  Next due date
                </label>

                <input
                  type="date"
                  id="nextDueDate"
                  name="nextDueDate"
                  value={formData.nextDueDate}
                  onChange={handleChange}
                  min={
                    formData.vaccinationDate ||
                    undefined
                  }
                  disabled={
                    isSubmitting ||
                    !canModifyInformation
                  }
                />
              </div>

              <div className="add-vaccination-field add-vaccination-field-full">
                <label htmlFor="notes">
                  Notes
                </label>

                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add hospital, doctor, batch number or other information"
                  rows="5"
                  maxLength="1000"
                  disabled={
                    isSubmitting ||
                    !canModifyInformation
                  }
                />
              </div>
            </div>
          </section>

          <section className="add-vaccination-actions">
            <button
              type="button"
              className="add-vaccination-cancel-button"
              onClick={() =>
                navigate(
                  `/vaccinations/${vaccinationId}`,
                )
              }
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="add-vaccination-submit-button"
              disabled={
                isSubmitting ||
                !canModifyInformation
              }
            >
              {isSubmitting
                ? "Saving changes..."
                : "Save Changes"}
            </button>
          </section>
        </form>
      )}
    </DashboardLayout>
  );
}

export default EditVaccination;