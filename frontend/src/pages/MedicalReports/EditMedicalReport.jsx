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

const initialFormData = {
  memberId: "",
  recordType: "",
  value: "",
  recordDate: "",
  status: "Normal",
  notes: "",
};

function getDateInputValue(
  dateValue,
) {
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

function getMemberId(report) {
  if (!report?.memberId) {
    return "";
  }

  return typeof report.memberId ===
    "object"
    ? report.memberId._id
    : report.memberId;
}

function EditMedicalReport() {
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
          reportResult,
          membersResult,
        ] = await Promise.all([
          apiRequest(
            `/medical-reports/${reportId}`,
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

        const report =
          reportResult?.data;

        const familyMembers =
          Array.isArray(
            membersResult?.data,
          )
            ? membersResult.data
            : [];

        setMembers(familyMembers);

        if (!report) {
          setErrorMessage(
            "Medical report not found.",
          );

          return;
        }

        setFormData({
          memberId:
            getMemberId(report),

          recordType:
            report.recordType || "",

          value:
            report.value || "",

          recordDate:
            getDateInputValue(
              report.recordDate,
            ),

          status:
            report.status || "Normal",

          notes:
            report.notes || "",
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
            : "Unable to load medical report.",
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
    reportId,
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
        "You have view-only access and cannot update medical reports.",
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
      await apiRequest(
        `/medical-reports/${reportId}`,
        {
          method: "PUT",
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
        `/medical-reports/${reportId}`,
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
          : "Unable to update medical report.",
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
            navigate(
              `/medical-reports/${reportId}`,
            )
          }
        >
          ← Medical Report
        </button>

        <h2>Edit Medical Report</h2>

        <p>
          Update this family health record and
          save the latest information.
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
          Only a Health Manager can edit medical
          reports.
        </div>
      )}

      {isLoading ? (
        <section className="report-details-state">
          <span className="reports-loader" />

          <strong>
            Loading medical report...
          </strong>
        </section>
      ) : (
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
                  Update the family member and
                  health-record information.
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
                  Update the report status and
                  medical observations.
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
                navigate(
                  `/medical-reports/${reportId}`,
                )
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

export default EditMedicalReport;