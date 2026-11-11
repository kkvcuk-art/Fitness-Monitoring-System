import {
  useEffect,
  useState,
} from "react";

import {
  Link,
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

import "./EditMember.css";

const initialFormData = {
  fullName: "",
  dateOfBirth: "",
  gender: "Not specified",
  bloodGroup: "Unknown",
  phone: "",
  email: "",
  healthStatus: "Unknown",
  allergies: "",
  previousDiseases: "",
  surgeryHistory: "",
  vaccinationHistory: "",
  familyDiseases: "",
  additionalHealthNotes: "",
  isLiving: "true",
};

function toDateInputValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date
    .toISOString()
    .split("T")[0];
}

function EditMember() {
  const {
    memberId,
  } = useParams();

  const navigate = useNavigate();

  const {
    token,
    user,
    canModifyInformation,
    signOut,
  } = useAuth();

  const [
    formData,
    setFormData,
  ] = useState(initialFormData);

  const [
    memberName,
    setMemberName,
  ] = useState("");

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

  const isOwnProfile =
    String(
      user?.memberProfileId || "",
    ) === String(memberId);

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  useEffect(() => {
    let componentIsActive = true;

    async function loadMember() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const result =
          await apiRequest(
            `/members/${memberId}`,
            {
              token,
            },
          );

        if (!componentIsActive) {
          return;
        }

        const member =
          result?.data;

        setMemberName(
          member.fullName,
        );

        setFormData({
          fullName:
            member.fullName || "",

          dateOfBirth:
            toDateInputValue(
              member.dateOfBirth,
            ),

          gender:
            member.gender ||
            "Not specified",

          bloodGroup:
            member.bloodGroup ||
            "Unknown",

          phone:
            member.phone || "",

          email:
            member.email || "",

          healthStatus:
            member.healthStatus ||
            "Unknown",

          allergies:
            member.allergies || "",

          previousDiseases:
            member.previousDiseases ||
            "",

          surgeryHistory:
            member.surgeryHistory ||
            "",

          vaccinationHistory:
            member.vaccinationHistory ||
            "",

          familyDiseases:
            member.familyDiseases ||
            "",

          additionalHealthNotes:
            member.additionalHealthNotes ||
            "",

          isLiving:
            String(
              member.isLiving !== false,
            ),
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
            : "Unable to load family member.",
        );
      } finally {
        if (componentIsActive) {
          setIsLoading(false);
        }
      }
    }

    loadMember();

    return () => {
      componentIsActive = false;
    };
  }, [
    memberId,
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

    if (
      isSubmitting ||
      !canModifyInformation ||
      isOwnProfile
    ) {
      return;
    }

    if (
      !formData.fullName.trim() ||
      !formData.dateOfBirth
    ) {
      setErrorMessage(
        "Full name and date of birth are required.",
      );

      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await apiRequest(
        `/members/${memberId}`,
        {
          method: "PUT",
          token,

          body: {
            ...formData,

            isLiving:
              formData.isLiving ===
              "true",
          },
        },
      );

      navigate(
        `/members/${memberId}`,
        {
          replace: true,

          state: {
            successMessage:
              `${formData.fullName.trim()} was updated successfully.`,
          },
        },
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update family member.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="member-details-state">
          <span className="members-loader" />

          <strong>
            Loading member profile...
          </strong>
        </div>
      </DashboardLayout>
    );
  }

  if (
    !canModifyInformation ||
    isOwnProfile
  ) {
    return (
      <DashboardLayout>
        <section className="add-member-denied">
          <span aria-hidden="true">
            🔒
          </span>

          <h2>
            Profile editing unavailable
          </h2>

          <p>
            {isOwnProfile
              ? "Your linked account profile will be edited from the My Profile page."
              : "Only a Health Manager older than 21 can edit family profiles."}
          </p>

          <Link
            to={`/members/${memberId}`}
          >
            Back to Member Details
          </Link>
        </section>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <section className="add-member-header">
        <div>
          <Link
            to={`/members/${memberId}`}
            className="add-member-back"
          >
            ← {memberName}
          </Link>

          <h2>Edit Family Member</h2>

          <p>
            Update personal and health
            information for this family member.
          </p>
        </div>
      </section>

      <form
        className="add-member-form"
        onSubmit={handleSubmit}
        noValidate
      >
        {errorMessage && (
          <div
            className="add-member-message"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        <section className="add-member-form-section">
          <div className="add-form-section-heading">
            <span>01</span>

            <div>
              <h3>Personal information</h3>

              <p>
                Identity and contact details.
              </p>
            </div>
          </div>

          <div className="add-member-fields-grid">
            <div className="add-member-field full-width">
              <label htmlFor="fullName">
                Full name *
              </label>

              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="add-member-field">
              <label htmlFor="dateOfBirth">
                Date of birth *
              </label>

              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                max={today}
                disabled={isSubmitting}
              />
            </div>

            <div className="add-member-field">
              <label htmlFor="gender">
                Gender
              </label>

              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="Not specified">
                  Not specified
                </option>

                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            <div className="add-member-field">
              <label htmlFor="phone">
                Phone
              </label>

              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="add-member-field">
              <label htmlFor="email">
                Email
              </label>

              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="add-member-field">
              <label htmlFor="isLiving">
                Living status
              </label>

              <select
                id="isLiving"
                name="isLiving"
                value={formData.isLiving}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="true">
                  Living
                </option>

                <option value="false">
                  Deceased
                </option>
              </select>
            </div>
          </div>
        </section>

        <section className="add-member-form-section">
          <div className="add-form-section-heading">
            <span>02</span>

            <div>
              <h3>Health information</h3>

              <p>
                Important basic health history.
              </p>
            </div>
          </div>

          <div className="add-member-fields-grid">
            <div className="add-member-field">
              <label htmlFor="bloodGroup">
                Blood group
              </label>

              <select
                id="bloodGroup"
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                {[
                  "Unknown",
                  "A+",
                  "A-",
                  "B+",
                  "B-",
                  "AB+",
                  "AB-",
                  "O+",
                  "O-",
                ].map((group) => (
                  <option
                    value={group}
                    key={group}
                  >
                    {group}
                  </option>
                ))}
              </select>
            </div>

            <div className="add-member-field">
              <label htmlFor="healthStatus">
                Health status
              </label>

              <select
                id="healthStatus"
                name="healthStatus"
                value={formData.healthStatus}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="Unknown">
                  Unknown
                </option>

                <option value="Good">
                  Good
                </option>

                <option value="Needs Attention">
                  Needs Attention
                </option>

                <option value="Critical">
                  Critical
                </option>
              </select>
            </div>

            {[
              [
                "allergies",
                "Allergies",
              ],

              [
                "previousDiseases",
                "Previous diseases",
              ],

              [
                "surgeryHistory",
                "Surgery history",
              ],

              [
                "vaccinationHistory",
                "Vaccination history",
              ],

              [
                "familyDiseases",
                "Family diseases",
              ],

              [
                "additionalHealthNotes",
                "Additional health notes",
              ],
            ].map(
              ([name, label]) => (
                <div
                  className="add-member-field"
                  key={name}
                >
                  <label htmlFor={name}>
                    {label}
                  </label>

                  <textarea
                    id={name}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    rows="4"
                  />
                </div>
              ),
            )}
          </div>
        </section>

        <div className="add-member-form-actions">
          <Link
            to={`/members/${memberId}`}
            className="add-member-cancel"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="add-member-submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Saving changes..."
              : "Save changes"}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}

export default EditMember;