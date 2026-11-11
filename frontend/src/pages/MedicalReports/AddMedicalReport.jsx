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

import "./AddMedicalReport.css";

const initialFormData = {
  memberId: "",
  recordType: "",
  value: "",
  recordDate: "",
  status: "Normal",
  notes: "",
};

const recordTypes = [
  "Blood Pressure",
  "Blood Sugar",
  "Heart Rate",
  "Body Temperature",
  "Weight",
  "Hemoglobin",
  "Cholesterol",
  "Medical Test",
  "Doctor Visit",
  "Other",
];

const reportStatuses = [
  "Normal",
  "Abnormal",
  "High",
  "Low",
  "Critical",
  "Stable",
  "Pending",
  "Completed",
];

function AddMedicalReport() {
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
        "You have view-only access and cannot add medical reports.",
      );

      return;
    }

    if (
      !formData.memberId ||
      !formData.recordType ||
      !formData.value.trim() ||
      !formData.recordDate
    ) {
      setErrorMessage(
        "Please complete all required fields.",
      );

      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const result = await apiRequest(
        "/medical-reports",
        {
          method: "POST",
          token,
          body: {
            memberId:
              formData.memberId,

            recordType:
              formData.recordType,

            value:
              formData.value.trim(),

            recordDate:
              formData.recordDate,

            status:
              formData.status,

            notes:
              formData.notes.trim(),
          },
        },
      );

      navigate(
        `/medical-reports/${result.data._id}`,
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
          : "Unable to add medical report.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardLayout>
      <section className="add-report-page-header">
        <button
          type="button"
          className="add-report-back-link"
          onClick={() =>
            navigate("/medical-reports")
          }
        >
          ← Medical Reports
        </button>

        <h2>Add Medical Report</h2>

        <p>
          Add a health record for a member of
          your family.
        </p>
      </section>

      {errorMessage && (
        <div
          className="add-report-error"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {!canModifyInformation && (
        <div
          className="add-report-warning"
          role="alert"
        >
          Your account has view-only access.
          Only a Health Manager can add medical
          reports.
        </div>
      )}

      <form
        className="add-report-form"
        onSubmit={handleSubmit}
      >
        <section className="add-report-card">
          <div className="add-report-section-heading">
            <span>01</span>

            <div>
              <h3>
                Member and record
              </h3>

              <p>
                Select the family member and
                type of health record.
              </p>
            </div>
          </div>

          <div className="add-report-divider" />

          <div className="add-report-grid">
            <div className="add-report-field">
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

            <div className="add-report-field">
              <label htmlFor="recordType">
                Record type *
              </label>

              <select
                id="recordType"
                name="recordType"
                value={formData.recordType}
                onChange={handleChange}
                disabled={
                  isSubmitting ||
                  !canModifyInformation
                }
                required
              >
                <option value="">
                  Select record type
                </option>

                {recordTypes.map(
                  (recordType) => (
                    <option
                      value={recordType}
                      key={recordType}
                    >
                      {recordType}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="add-report-field">
              <label htmlFor="value">
                Result or value *
              </label>

              <input
                type="text"
                id="value"
                name="value"
                value={formData.value}
                onChange={handleChange}
                placeholder="Example: 120/80 mmHg"
                disabled={
                  isSubmitting ||
                  !canModifyInformation
                }
                maxLength="150"
                required
              />
            </div>

            <div className="add-report-field">
              <label htmlFor="recordDate">
                Record date *
              </label>

              <input
                type="date"
                id="recordDate"
                name="recordDate"
                value={formData.recordDate}
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
                required
              />
            </div>
          </div>
        </section>

        <section className="add-report-card">
          <div className="add-report-section-heading">
            <span>02</span>

            <div>
              <h3>
                Status and notes
              </h3>

              <p>
                Add the current status and any
                useful medical information.
              </p>
            </div>
          </div>

          <div className="add-report-divider" />

          <div className="add-report-grid">
            <div className="add-report-field">
              <label htmlFor="status">
                Report status
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
              >
                {reportStatuses.map(
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

            <div className="add-report-field add-report-field-full">
              <label htmlFor="notes">
                Notes
              </label>

              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add doctor advice, observations or additional details"
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

        <section className="add-report-actions">
          <button
            type="button"
            className="add-report-cancel-button"
            onClick={() =>
              navigate("/medical-reports")
            }
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="add-report-submit-button"
            disabled={
              isSubmitting ||
              isLoadingMembers ||
              members.length === 0 ||
              !canModifyInformation
            }
          >
            {isSubmitting
              ? "Saving report..."
              : "Add Medical Report"}
          </button>
        </section>
      </form>
    </DashboardLayout>
  );
}

export default AddMedicalReport;