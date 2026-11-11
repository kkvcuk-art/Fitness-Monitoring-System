import {
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router";

import DashboardLayout from "../../layouts/DashboardLayout";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  apiRequest,
} from "../../services/apiService";

import "./AddMember.css";

const initialFormData = {
  fullName: "",
  dateOfBirth: "",
  gender: "Not specified",
  bloodGroup: "Unknown",
  phone: "",
  email: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  healthStatus: "Good",

  weightKg: 68,
  heightCm: 168,
  systolicBp: 120,
  diastolicBp: 80,
  fastingGlucose: 95,
  cholesterol: 190,
  sleepHours: 7.0,
  activityMinutes: 30,

  allergies: "",
  previousDiseases: "",
  surgeryHistory: "",
  familyDiseases: "",

  relationshipToMe: "",
  relationshipNature: "biological",
};

/* =========================================================
   CONVERT UI RELATIONSHIP INTO GRAPH RELATIONSHIP
   ========================================================= */

function createRelationshipPayload({
  relationshipToMe,
  relationshipNature,
  newMemberId,
  userMemberProfileId,
}) {
  const parentLabels = [
    "father",
    "mother",
    "parent",
  ];

  const childLabels = [
    "son",
    "daughter",
    "child",
  ];

  const siblingLabels = [
    "brother",
    "sister",
    "sibling",
  ];

  const spouseLabels = [
    "husband",
    "wife",
    "spouse",
  ];

  if (
    parentLabels.includes(
      relationshipToMe,
    )
  ) {
    return {
      fromMember: newMemberId,
      toMember: userMemberProfileId,
      relationshipType: "parent",
      relationshipNature,
    };
  }

  if (
    childLabels.includes(
      relationshipToMe,
    )
  ) {
    return {
      fromMember: userMemberProfileId,
      toMember: newMemberId,
      relationshipType: "parent",
      relationshipNature,
    };
  }

  if (
    siblingLabels.includes(
      relationshipToMe,
    )
  ) {
    return {
      fromMember: userMemberProfileId,
      toMember: newMemberId,
      relationshipType: "sibling",
      relationshipNature,
    };
  }

  if (
    spouseLabels.includes(
      relationshipToMe,
    )
  ) {
    return {
      fromMember: userMemberProfileId,
      toMember: newMemberId,
      relationshipType: "spouse",
      relationshipNature: "marital",
    };
  }

  if (
    relationshipToMe === "guardian"
  ) {
    return {
      fromMember: newMemberId,
      toMember: userMemberProfileId,
      relationshipType: "guardian",
      relationshipNature: "guardian",
    };
  }

  if (
    relationshipToMe === "dependent"
  ) {
    return {
      fromMember: userMemberProfileId,
      toMember: newMemberId,
      relationshipType: "guardian",
      relationshipNature: "guardian",
    };
  }

  throw new Error(
    "Please select a valid relationship.",
  );
}

function AddMember() {
  const navigate = useNavigate();

  const {
    token,
    user,
    canModifyInformation,
  } = useAuth();

  const [
    formData,
    setFormData,
  ] = useState(initialFormData);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const relationshipNeedsNature =
    useMemo(
      () =>
        ![
          "husband",
          "wife",
          "spouse",
          "guardian",
          "dependent",
        ].includes(
          formData.relationshipToMe,
        ),
      [
        formData.relationshipToMe,
      ],
    );

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

    if (message) {
      setMessage("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      isSubmitting ||
      !canModifyInformation
    ) {
      return;
    }

    setMessage("");

    if (
      !formData.fullName.trim() ||
      !formData.dateOfBirth ||
      !formData.relationshipToMe
    ) {
      setMessage(
        "Full name, date of birth and relationship are required.",
      );

      return;
    }

    if (!user?.memberProfileId) {
      setMessage(
        "Your family-tree profile is missing. Please login again.",
      );

      return;
    }

    setIsSubmitting(true);

    let createdMemberId = null;

    try {
      /*
       * Step 1: Create personal profile.
       */
      const memberResult =
        await apiRequest(
          "/members",
          {
            method: "POST",
            token,

            body: {
              fullName:
                formData.fullName,

              dateOfBirth:
                formData.dateOfBirth,

              gender:
                formData.gender,

              bloodGroup:
                formData.bloodGroup,

              phone:
                formData.phone,

              email:
                formData.email,

              emergencyContactName:
                formData.emergencyContactName,

              emergencyContactPhone:
                formData.emergencyContactPhone,

              weightKg:
                Number(formData.weightKg) || 68,

              heightCm:
                Number(formData.heightCm) || 168,

              systolicBp:
                Number(formData.systolicBp) || 120,

              diastolicBp:
                Number(formData.diastolicBp) || 80,

              fastingGlucose:
                Number(formData.fastingGlucose) || 95,

              cholesterol:
                Number(formData.cholesterol) || 190,

              sleepHours:
                Number(formData.sleepHours) || 7.0,

              activityMinutes:
                Number(formData.activityMinutes) || 30,

              allergies:
                formData.allergies,

              previousDiseases:
                formData.previousDiseases,

              surgeryHistory:
                formData.surgeryHistory,

              familyDiseases:
                formData.familyDiseases,
            },
          },
        );

      createdMemberId =
        memberResult?.data?._id;

      if (!createdMemberId) {
        throw new Error(
          "Member profile was created without an ID.",
        );
      }

      /*
       * Step 2: Create relationship to the user.
       */
      const relationshipPayload =
        createRelationshipPayload({
          relationshipToMe:
            formData.relationshipToMe,

          relationshipNature:
            relationshipNeedsNature
              ? formData.relationshipNature
              : undefined,

          newMemberId:
            createdMemberId,

          userMemberProfileId:
            user.memberProfileId,
        });

      await apiRequest(
        "/relationships",
        {
          method: "POST",
          token,
          body:
            relationshipPayload,
        },
      );

      navigate("/members", {
        replace: true,

        state: {
          successMessage:
            `${formData.fullName.trim()} was added successfully.`,
        },
      });
    } catch (error) {
      /*
       * If relationship creation fails, remove the
       * newly created orphan member profile.
       */
      if (createdMemberId) {
        try {
          await apiRequest(
            `/members/${createdMemberId}`,
            {
              method: "DELETE",
              token,
            },
          );
        } catch {
          // Preserve the original error message.
        }
      }

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to add family member.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!canModifyInformation) {
    return (
      <DashboardLayout>
        <section className="add-member-denied">
          <span aria-hidden="true">
            🔒
          </span>

          <h2>View-only access</h2>

          <p>
            Only a Health Manager older than
            21 can add family members.
          </p>

          <Link to="/members">
            Back to Family Members
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
            to="/members"
            className="add-member-back"
          >
            ← Family Members
          </Link>

          <h2>Add Family Member</h2>

          <p>
            Add personal information and connect
            this person to your family tree.
          </p>
        </div>
      </section>

      <form
        className="add-member-form"
        onSubmit={handleSubmit}
        noValidate
      >
        {message && (
          <div
            className="add-member-message"
            role="alert"
          >
            {message}
          </div>
        )}

        <section className="add-member-form-section">
          <div className="add-form-section-heading">
            <span>01</span>

            <div>
              <h3>Personal information</h3>

              <p>
                Basic profile information for
                this family member.
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
                placeholder="Enter full name"
                disabled={isSubmitting}
                required
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
                required
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
              <label htmlFor="phone">
                Phone
              </label>

              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Optional phone number"
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
                placeholder="Optional email address"
                disabled={isSubmitting}
              />
            </div>

            <div className="add-member-field">
              <label htmlFor="emergencyContactName">
                🚨 Emergency Contact Name *
              </label>

              <input
                type="text"
                id="emergencyContactName"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                placeholder="e.g. Primary Caregiver / Spouse"
                disabled={isSubmitting}
              />
            </div>

            <div className="add-member-field">
              <label htmlFor="emergencyContactPhone">
                🚨 Emergency Contact Phone *
              </label>

              <input
                type="tel"
                id="emergencyContactPhone"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                placeholder="e.g. +1 (555) 911-0199"
                disabled={isSubmitting}
              />
            </div>

            <div className="add-member-field full-width" style={{ marginTop: "0.5rem" }}>
              <label>🤖 Automated Health Status (Auto-Evaluated from Vitals)</label>
              <div style={{
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                fontWeight: "800",
                fontSize: "0.95rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: (formData.systolicBp >= 140 || formData.fastingGlucose >= 135 || formData.cholesterol >= 240)
                  ? "#fee2e2"
                  : (formData.systolicBp >= 130 || formData.fastingGlucose >= 105)
                  ? "#fef3c7"
                  : "#d1fae5",
                color: (formData.systolicBp >= 140 || formData.fastingGlucose >= 135 || formData.cholesterol >= 240)
                  ? "#991b1b"
                  : (formData.systolicBp >= 130 || formData.fastingGlucose >= 105)
                  ? "#92400e"
                  : "#065f46",
                border: "1px solid #cbd5e1"
              }}>
                {(formData.systolicBp >= 140 || formData.fastingGlucose >= 135 || formData.cholesterol >= 240)
                  ? "🔴 CRITICAL (High BP / Glucose detected)"
                  : (formData.systolicBp >= 130 || formData.fastingGlucose >= 105)
                  ? "🟡 NEEDS ATTENTION (Elevated markers)"
                  : "🟢 GOOD (Normal vitals range)"}
              </div>
            </div>
          </div>
        </section>

        {/* Section 02: Baseline Physiological Vitals & Medical History */}
        <section className="add-member-form-section">
          <div className="add-form-section-heading">
            <span>02</span>

            <div>
              <h3>Physiological Vitals & Baseline Health</h3>

              <p>
                Baseline physiological metrics used by the AI Risk Prediction & Digital Twin engine. Normal reference ranges are indicated in brackets.
              </p>
            </div>
          </div>

          {/* 💡 Clinical Normal Reference Ranges Guide Box */}
          <div style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderLeft: "4px solid #3b82f6",
            borderRadius: "10px",
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
            fontSize: "0.85rem",
            color: "#1e40af"
          }}>
            <strong style={{ fontSize: "0.95rem", display: "block", marginBottom: "0.4rem" }}>
              💡 Standard Healthy Reference Ranges Guide:
            </strong>
            <ul style={{ margin: 0, paddingLeft: "1.2rem", lineHeight: "1.5" }}>
              <li><strong>Blood Pressure (BP)</strong>: Normal Average is <strong>120 / 80 mmHg</strong> (Systolic: 90–120 mmHg, Diastolic: 60–80 mmHg).</li>
              <li><strong>Fasting Blood Sugar (Glucose)</strong>: Normal Average is <strong>70 – 99 mg/dL</strong> (Pre-diabetes: 100–125 mg/dL).</li>
              <li><strong>Total Cholesterol</strong>: Healthy Target is <strong>&lt; 200 mg/dL</strong>.</li>
              <li><strong>Nightly Sleep & Activity</strong>: Target <strong>7–9 Hours</strong> of sleep and <strong>30+ Mins</strong> of daily physical activity.</li>
            </ul>
          </div>

          <div className="add-member-fields-grid">
            <div className="add-member-field">
              <label htmlFor="weightKg">Weight (kg) <span style={{ color: "#2563eb", fontWeight: 600 }}>(Normal Avg: 55 – 75 kg)</span></label>
              <input
                type="number"
                id="weightKg"
                name="weightKg"
                value={formData.weightKg}
                onChange={handleChange}
                placeholder="Normal Avg: 68 kg"
                disabled={isSubmitting}
              />
            </div>

            <div className="add-member-field">
              <label htmlFor="heightCm">Height (cm) <span style={{ color: "#2563eb", fontWeight: 600 }}>(Normal Avg: 155 – 180 cm)</span></label>
              <input
                type="number"
                id="heightCm"
                name="heightCm"
                value={formData.heightCm}
                onChange={handleChange}
                placeholder="Normal Avg: 168 cm"
                disabled={isSubmitting}
              />
            </div>

            <div className="add-member-field">
              <label htmlFor="systolicBp">Systolic BP (mmHg) <span style={{ color: "#dc2626", fontWeight: 700 }}>(Normal Avg: 120 mmHg [Range: 90–120])</span></label>
              <input
                type="number"
                id="systolicBp"
                name="systolicBp"
                value={formData.systolicBp}
                onChange={handleChange}
                placeholder="Target: 120 mmHg"
                disabled={isSubmitting}
              />
            </div>

            <div className="add-member-field">
              <label htmlFor="diastolicBp">Diastolic BP (mmHg) <span style={{ color: "#dc2626", fontWeight: 700 }}>(Normal Avg: 80 mmHg [Range: 60–80])</span></label>
              <input
                type="number"
                id="diastolicBp"
                name="diastolicBp"
                value={formData.diastolicBp}
                onChange={handleChange}
                placeholder="Target: 80 mmHg"
                disabled={isSubmitting}
              />
            </div>

            <div className="add-member-field">
              <label htmlFor="fastingGlucose">Fasting Glucose (mg/dL) <span style={{ color: "#d97706", fontWeight: 700 }}>(Normal Avg: 95 mg/dL [Range: 70–99])</span></label>
              <input
                type="number"
                id="fastingGlucose"
                name="fastingGlucose"
                value={formData.fastingGlucose}
                onChange={handleChange}
                placeholder="Target: 70–99 mg/dL"
                disabled={isSubmitting}
              />
            </div>

            <div className="add-member-field">
              <label htmlFor="cholesterol">Total Cholesterol (mg/dL) <span style={{ color: "#2563eb", fontWeight: 600 }}>(Target: &lt; 200 mg/dL)</span></label>
              <input
                type="number"
                id="cholesterol"
                name="cholesterol"
                value={formData.cholesterol}
                onChange={handleChange}
                placeholder="Target: < 200 mg/dL"
                disabled={isSubmitting}
              />
            </div>

            <div className="add-member-field">
              <label htmlFor="sleepHours">Nightly Sleep (Hours) <span style={{ color: "#059669", fontWeight: 600 }}>(Normal Avg: 7.0 – 9.0 hrs)</span></label>
              <input
                type="number"
                step="0.5"
                id="sleepHours"
                name="sleepHours"
                value={formData.sleepHours}
                onChange={handleChange}
                placeholder="Target: 7.5 hrs"
                disabled={isSubmitting}
              />
            </div>

            <div className="add-member-field">
              <label htmlFor="activityMinutes">Daily Aerobic Activity (Mins) <span style={{ color: "#059669", fontWeight: 600 }}>(Target: 30+ Mins/Day)</span></label>
              <input
                type="number"
                id="activityMinutes"
                name="activityMinutes"
                value={formData.activityMinutes}
                onChange={handleChange}
                placeholder="Target: 30 mins"
                disabled={isSubmitting}
              />
            </div>

            <div className="add-member-field full-width">
              <label htmlFor="allergies">Severe Allergies (e.g. Penicillin, Peanuts)</label>
              <input
                type="text"
                id="allergies"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                placeholder="e.g. Penicillin, Dust Mites"
                disabled={isSubmitting}
              />
            </div>

            <div className="add-member-field full-width">
              <label htmlFor="familyDiseases">Family Disease History (e.g. Diabetes, Hypertension)</label>
              <input
                type="text"
                id="familyDiseases"
                name="familyDiseases"
                value={formData.familyDiseases}
                onChange={handleChange}
                placeholder="e.g. Father has Type-2 Diabetes; Mother has Hypertension"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </section>

        <section className="add-member-form-section">
          <div className="add-form-section-heading">
            <span>03</span>

            <div>
              <h3>Family-tree connection</h3>

              <p>
                Define this person&apos;s
                relationship to you.
              </p>
            </div>
          </div>

          <div className="add-member-fields-grid">
            <div className="add-member-field">
              <label htmlFor="relationshipToMe">
                Relationship to me *
              </label>

              <select
                id="relationshipToMe"
                name="relationshipToMe"
                value={formData.relationshipToMe}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              >
                <option value="">
                  Select relationship
                </option>

                <optgroup label="Parent">
                  <option value="father">
                    Father
                  </option>

                  <option value="mother">
                    Mother
                  </option>

                  <option value="parent">
                    Parent
                  </option>
                </optgroup>

                <optgroup label="Child">
                  <option value="son">
                    Son
                  </option>

                  <option value="daughter">
                    Daughter
                  </option>

                  <option value="child">
                    Child
                  </option>
                </optgroup>

                <optgroup label="Spouse">
                  <option value="husband">
                    Husband
                  </option>

                  <option value="wife">
                    Wife
                  </option>

                  <option value="spouse">
                    Spouse
                  </option>
                </optgroup>

                <optgroup label="Sibling">
                  <option value="brother">
                    Brother
                  </option>

                  <option value="sister">
                    Sister
                  </option>

                  <option value="sibling">
                    Sibling
                  </option>
                </optgroup>

                <option value="guardian">
                  Guardian
                </option>

                <option value="dependent">
                  Dependent
                </option>
              </select>
            </div>

            {relationshipNeedsNature && (
              <div className="add-member-field">
                <label htmlFor="relationshipNature">
                  Relationship nature
                </label>

                <select
                  id="relationshipNature"
                  name="relationshipNature"
                  value={formData.relationshipNature}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  <option value="biological">
                    Biological
                  </option>

                  <option value="adoptive">
                    Adoptive
                  </option>

                  <option value="step">
                    Step
                  </option>

                  <option value="unknown">
                    Unknown
                  </option>
                </select>
              </div>
            )}
          </div>

          <p className="relationship-help">
            Relationship is stored separately
            from the member profile, allowing the
            same person to have different
            relationships with different family
            members.
          </p>
        </section>

        <div className="add-member-form-actions">
          <Link
            to="/members"
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
              ? "Adding member..."
              : "Add to family"}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}

export default AddMember;