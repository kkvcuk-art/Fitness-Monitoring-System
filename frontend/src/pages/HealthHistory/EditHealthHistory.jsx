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

const healthStatuses = [
  "Active",
  "Recovered",
  "Chronic",
  "Under Treatment",
  "Unknown",
];

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

function getMemberId(record) {
  if (!record?.memberId) {
    return "";
  }

  return typeof record.memberId ===
    "object"
    ? record.memberId._id
    : record.memberId;
}

function EditHealthHistory() {
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
          historyResult,
          membersResult,
        ] = await Promise.all([
          apiRequest(
            `/health-history/${historyId}`,
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

        const record =
          historyResult?.data;

        const familyMembers =
          Array.isArray(
            membersResult?.data,
          )
            ? membersResult.data
            : [];

        setMembers(familyMembers);

        if (!record) {
          setErrorMessage(
            "Health-history record not found.",
          );

          return;
        }

        setFormData({
          memberId:
            getMemberId(record),

          conditionName:
            record.conditionName || "",

          diagnosisDate:
            getDateInputValue(
              record.diagnosisDate,
            ),

          status:
            record.status || "Active",

          hereditary:
            record.hereditary === true,

          treatment:
            record.treatment || "",

          doctorName:
            record.doctorName || "",

          hospitalName:
            record.hospitalName || "",

          notes:
            record.notes || "",
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
            : "Unable to load health-history record.",
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
    historyId,
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
        "You have view-only access and cannot update health-history records.",
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
      await apiRequest(
        `/health-history/${historyId}`,
        {
          method: "PUT",
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
        `/health-history/${historyId}`,
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
          : "Unable to update health-history record.",
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
            navigate(
              `/health-history/${historyId}`,
            )
          }
        >
          ← Health Record Details
        </button>

        <h2>Edit Health Record</h2>

        <p>
          Update this condition, treatment and
          hereditary health information.
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
          Only a Health Manager can edit
          health-history records.
        </div>
      )}

      {isLoading ? (
        <section className="history-details-state">
          <span className="history-loader" />

          <strong>
            Loading health record...
          </strong>
        </section>
      ) : (
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
                  Update the member and health
                  condition.
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
                  value={
                    formData.diagnosisDate
                  }
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
                  Update treatment, doctor and
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
                navigate(
                  `/health-history/${historyId}`,
                )
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

export default EditHealthHistory;