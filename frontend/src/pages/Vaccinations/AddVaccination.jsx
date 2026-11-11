import {
  useEffect,
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

import "./AddVaccination.css";

const initialFormData = {
  memberId: "",
  vaccineName: "",
  dose: "",
  vaccinationDate: "",
  nextDueDate: "",
  status: "Completed",
  notes: "",
};

const vaccinationStatuses = [
  "Completed",
  "Upcoming",
  "Missed",
];

function AddVaccination() {
  const navigate = useNavigate();

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
    isLoadingMembers,
    setIsLoadingMembers,
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

    async function loadMembers() {
      setIsLoadingMembers(true);
      setErrorMessage("");

      try {
        const result = await apiRequest(
          "/members",
          {
            token,
          },
        );

        if (!componentIsActive) {
          return;
        }

        const familyMembers =
          Array.isArray(result?.data)
            ? result.data
            : [];

        setMembers(familyMembers);

        if (familyMembers.length > 0) {
          setFormData(
            (currentData) => ({
              ...currentData,

              memberId:
                currentData.memberId ||
                familyMembers[0]._id,
            }),
          );
        }
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
            : "Unable to load family members.",
        );
      } finally {
        if (componentIsActive) {
          setIsLoadingMembers(false);
        }
      }
    }

    loadMembers();

    return () => {
      componentIsActive = false;
    };
  }, [
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
        "You have view-only access and cannot add vaccination records.",
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
      const result = await apiRequest(
        "/vaccinations",
        {
          method: "POST",
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
        `/vaccinations/${result.data._id}`,
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
          : "Unable to add vaccination.",
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
            navigate("/vaccinations")
          }
        >
          ← Vaccinations
        </button>

        <h2>Add Vaccination</h2>

        <p>
          Add an immunization record for a
          member of your family.
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
          Only a Health Manager can add
          vaccination records.
        </div>
      )}

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
                Select the family member and
                enter vaccine details.
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
                  isLoadingMembers ||
                  isSubmitting ||
                  !canModifyInformation
                }
                required
              >
                <option value="">
                  {isLoadingMembers
                    ? "Loading family members..."
                    : "Select family member"}
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
                Add vaccination dates and
                additional information.
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
              navigate("/vaccinations")
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
              isLoadingMembers ||
              members.length === 0 ||
              !canModifyInformation
            }
          >
            {isSubmitting
              ? "Saving vaccination..."
              : "Add Vaccination"}
          </button>
        </section>
      </form>
    </DashboardLayout>
  );
}

export default AddVaccination;