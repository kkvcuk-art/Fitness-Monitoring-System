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

import "./AddHealthHistory.css";

const initialFormData = {
  memberId: "",
  conditionName: "",
  diagnosisDate: "",
  status: "Active",
  hereditary: false,
  treatment: "",
  doctorName: "",
  hospitalName: "",
  notes: "",
};

const healthStatuses = [
  "Active",
  "Recovered",
  "Chronic",
  "Under Treatment",
  "Unknown",
];

function AddHealthHistory() {
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
      type,
      checked,
    } = event.target;

    setFormData(
      (currentData) => ({
        ...currentData,

        [name]:
          type === "checkbox"
            ? checked
            : value,
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
        "You have view-only access and cannot add health-history records.",
      );

      return;
    }

    if (
      !formData.memberId ||
      !formData.conditionName.trim()
    ) {
      setErrorMessage(
        "Family member and health condition are required.",
      );

      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const result = await apiRequest(
        "/health-history",
        {
          method: "POST",
          token,

          body: {
            memberId:
              formData.memberId,

            conditionName:
              formData.conditionName.trim(),

            diagnosisDate:
              formData.diagnosisDate,

            status:
              formData.status,

            hereditary:
              formData.hereditary,

            treatment:
              formData.treatment.trim(),

            doctorName:
              formData.doctorName.trim(),

            hospitalName:
              formData.hospitalName.trim(),

            notes:
              formData.notes.trim(),
          },
        },
      );

      navigate(
        `/health-history/${result.data._id}`,
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
          : "Unable to add health-history record.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardLayout>
      <section className="add-history-page-header">
        <button
          type="button"
          className="add-history-back-link"
          onClick={() =>
            navigate("/health-history")
          }
        >
          ← Health History
        </button>

        <h2>Add Health Record</h2>

        <p>
          Add a disease, medical condition or
          long-term health record for a family
          member.
        </p>
      </section>

      {errorMessage && (
        <div
          className="add-history-error"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {!canModifyInformation && (
        <div
          className="add-history-warning"
          role="alert"
        >
          Your account has view-only access.
          Only a Health Manager can add
          health-history records.
        </div>
      )}

      <form
        className="add-history-form"
        onSubmit={handleSubmit}
      >
        <section className="add-history-card">
          <div className="add-history-section-heading">
            <span>01</span>

            <div>
              <h3>
                Condition information
              </h3>

              <p>
                Select the family member and
                enter the health condition.
              </p>
            </div>
          </div>

          <div className="add-history-divider" />

          <div className="add-history-grid">
            <div className="add-history-field">
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

            <div className="add-history-field">
              <label htmlFor="conditionName">
                Disease or condition *
              </label>

              <input
                type="text"
                id="conditionName"
                name="conditionName"
                value={formData.conditionName}
                onChange={handleChange}
                placeholder="Example: Diabetes, Asthma"
                maxLength="150"
                disabled={
                  isSubmitting ||
                  !canModifyInformation
                }
                required
              />
            </div>

            <div className="add-history-field">
              <label htmlFor="diagnosisDate">
                Diagnosis date
              </label>

              <input
                type="date"
                id="diagnosisDate"
                name="diagnosisDate"
                value={formData.diagnosisDate}
                onChange={handleChange}
                max={
                  new Date()
                    .toISOString()
                    .split("T")[0]
                }
                disabled={
                  isSubmitting ||
                  !canModifyInformation
                }
              />
            </div>

            <div className="add-history-field">
              <label htmlFor="status">
                Current status *
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
                {healthStatuses.map(
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

            <div className="add-history-field add-history-field-full">
              <label className="add-history-checkbox">
                <input
                  type="checkbox"
                  name="hereditary"
                  checked={
                    formData.hereditary
                  }
                  onChange={handleChange}
                  disabled={
                    isSubmitting ||
                    !canModifyInformation
                  }
                />

                <span>
                  This condition may be
                  hereditary or run in the
                  family
                </span>
              </label>
            </div>
          </div>
        </section>

        <section className="add-history-card">
          <div className="add-history-section-heading">
            <span>02</span>

            <div>
              <h3>
                Treatment information
              </h3>

              <p>
                Add treatment, doctor and
                hospital details.
              </p>
            </div>
          </div>

          <div className="add-history-divider" />

          <div className="add-history-grid">
            <div className="add-history-field">
              <label htmlFor="doctorName">
                Doctor name
              </label>

              <input
                type="text"
                id="doctorName"
                name="doctorName"
                value={formData.doctorName}
                onChange={handleChange}
                placeholder="Doctor's name"
                maxLength="120"
                disabled={
                  isSubmitting ||
                  !canModifyInformation
                }
              />
            </div>

            <div className="add-history-field">
              <label htmlFor="hospitalName">
                Hospital or clinic
              </label>

              <input
                type="text"
                id="hospitalName"
                name="hospitalName"
                value={formData.hospitalName}
                onChange={handleChange}
                placeholder="Hospital or clinic name"
                maxLength="150"
                disabled={
                  isSubmitting ||
                  !canModifyInformation
                }
              />
            </div>

            <div className="add-history-field add-history-field-full">
              <label htmlFor="treatment">
                Treatment
              </label>

              <textarea
                id="treatment"
                name="treatment"
                value={formData.treatment}
                onChange={handleChange}
                placeholder="Describe medicines, therapy or treatment"
                rows="4"
                maxLength="1000"
                disabled={
                  isSubmitting ||
                  !canModifyInformation
                }
              />
            </div>

            <div className="add-history-field add-history-field-full">
              <label htmlFor="notes">
                Additional notes
              </label>

              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add symptoms, observations or other details"
                rows="5"
                maxLength="1500"
                disabled={
                  isSubmitting ||
                  !canModifyInformation
                }
              />
            </div>
          </div>
        </section>

        <section className="add-history-actions">
          <button
            type="button"
            className="add-history-cancel-button"
            onClick={() =>
              navigate("/health-history")
            }
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="add-history-submit-button"
            disabled={
              isSubmitting ||
              isLoadingMembers ||
              members.length === 0 ||
              !canModifyInformation
            }
          >
            {isSubmitting
              ? "Saving health record..."
              : "Add Health Record"}
          </button>
        </section>
      </form>
    </DashboardLayout>
  );
}

export default AddHealthHistory;