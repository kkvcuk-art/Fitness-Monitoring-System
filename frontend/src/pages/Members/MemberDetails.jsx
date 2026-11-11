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

import "./MemberDetails.css";

function getId(value) {
  if (!value) {
    return "";
  }

  return String(
    typeof value === "object"
      ? value._id
      : value,
  );
}

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).format(date);
}

function getGenderLabel(
  gender,
  maleLabel,
  femaleLabel,
  neutralLabel,
) {
  if (gender === "Male") {
    return maleLabel;
  }

  if (gender === "Female") {
    return femaleLabel;
  }

  return neutralLabel;
}

function describeConnection(
  relationship,
  selectedMemberId,
) {
  const fromMember =
    relationship.fromMember;

  const toMember =
    relationship.toMember;

  const selectedIsFrom =
    getId(fromMember) ===
    String(selectedMemberId);

  const connectedMember =
    selectedIsFrom
      ? toMember
      : fromMember;

  let label = "Family member";

  if (
    relationship.relationshipType ===
    "parent"
  ) {
    if (selectedIsFrom) {
      label = getGenderLabel(
        connectedMember.gender,
        "Son",
        "Daughter",
        "Child",
      );
    } else {
      label = getGenderLabel(
        connectedMember.gender,
        "Father",
        "Mother",
        "Parent",
      );
    }
  }

  if (
    relationship.relationshipType ===
    "spouse"
  ) {
    label = getGenderLabel(
      connectedMember.gender,
      "Husband",
      "Wife",
      "Spouse",
    );
  }

  if (
    relationship.relationshipType ===
    "sibling"
  ) {
    label = getGenderLabel(
      connectedMember.gender,
      "Brother",
      "Sister",
      "Sibling",
    );
  }

  if (
    relationship.relationshipType ===
    "guardian"
  ) {
    label = selectedIsFrom
      ? "Dependent"
      : "Guardian";
  }

  return {
    id: relationship._id,
    member: connectedMember,
    label,
    nature:
      relationship.relationshipNature,
  };
}

function DetailItem({
  label,
  value,
}) {
  return (
    <div className="member-detail-item">
      <span>{label}</span>

      <strong>
        {value ||
          "Not available"}
      </strong>
    </div>
  );
}

function MemberDetails() {
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
    member,
    setMember,
  ] = useState(null);

  const [
    connections,
    setConnections,
  ] = useState([]);

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

  const isOwnProfile =
    String(
      user?.memberProfileId || "",
    ) === String(memberId);

  useEffect(() => {
    let componentIsActive = true;

    async function loadDetails() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [
          memberResult,
          relationshipsResult,
        ] = await Promise.all([
          apiRequest(
            `/members/${memberId}`,
            {
              token,
            },
          ),

          apiRequest(
            "/relationships",
            {
              token,
            },
          ),
        ]);

        if (!componentIsActive) {
          return;
        }

        const loadedMember =
          memberResult?.data;

        const allRelationships =
          Array.isArray(
            relationshipsResult?.data,
          )
            ? relationshipsResult.data
            : [];

        const memberConnections =
          allRelationships
            .filter(
              (relationship) =>
                getId(
                  relationship.fromMember,
                ) ===
                  String(memberId) ||
                getId(
                  relationship.toMember,
                ) ===
                  String(memberId),
            )
            .map(
              (relationship) =>
                describeConnection(
                  relationship,
                  memberId,
                ),
            );

        setMember(loadedMember);
        setConnections(
          memberConnections,
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
            : "Unable to load member details.",
        );
      } finally {
        if (componentIsActive) {
          setIsLoading(false);
        }
      }
    }

    loadDetails();

    return () => {
      componentIsActive = false;
    };
  }, [
    memberId,
    token,
    signOut,
    navigate,
  ]);

  async function handleDelete() {
    if (
      !canModifyInformation ||
      isOwnProfile ||
      isDeleting
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete ${member.fullName}? This action cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");

    try {
      /*
       * Relationships should be removed before
       * deleting a member profile.
       */
      for (
        const connection of connections
      ) {
        await apiRequest(
          `/relationships/${connection.id}`,
          {
            method: "DELETE",
            token,
          },
        );
      }

      await apiRequest(
        `/members/${memberId}`,
        {
          method: "DELETE",
          token,
        },
      );

      navigate("/members", {
        replace: true,

        state: {
          successMessage:
            `${member.fullName} was deleted successfully.`,
        },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete family member.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="member-details-state">
          <span className="members-loader" />

          <strong>
            Loading member details...
          </strong>
        </div>
      </DashboardLayout>
    );
  }

  if (
    errorMessage &&
    !member
  ) {
    return (
      <DashboardLayout>
        <div className="member-details-state">
          <span aria-hidden="true">
            ⚠
          </span>

          <strong>
            Member details could not be loaded
          </strong>

          <p>{errorMessage}</p>

          <Link to="/members">
            Back to Family Members
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <section className="member-details-header">
        <div>
          <Link
            to="/members"
            className="add-member-back"
          >
            ← Family Members
          </Link>

          <div className="member-details-title">
            <span className="member-details-avatar">
              {member?.fullName
                ?.trim()
                .split(/\s+/)
                .slice(0, 2)
                .map(
                  (part) =>
                    part.charAt(0),
                )
                .join("")
                .toUpperCase() ||
                "FM"}
            </span>

            <div>
              <h2>
                {member?.fullName}
              </h2>

              <p>
                {isOwnProfile
                  ? "Your linked family-tree profile"
                  : "Family member health profile"}
              </p>
            </div>
          </div>
        </div>

        {canModifyInformation && (
          <div className="member-details-actions">
            <button type="button" className="member-edit-button" onClick={() => navigate( `/members/${memberId}/edit`,)} disabled={isOwnProfile} title={ isOwnProfile
                ? "Your own account information will be edited from My Profile"
                : "Edit family member"}
>
                Edit Profile
            </button>

            <button
              type="button"
              className="member-delete-button"
              onClick={handleDelete}
              disabled={
                isOwnProfile ||
                isDeleting
              }
              title={
                isOwnProfile
                  ? "Your own linked profile cannot be deleted"
                  : "Delete family member"
              }
            >
              {isDeleting
                ? "Deleting..."
                : "Delete"}
            </button>
          </div>
        )}
      </section>

      {errorMessage && (
        <div
          className="add-member-message"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      <div className="member-details-grid">
        <section className="member-details-card">
          <div className="member-details-card-heading">
            <span>PROFILE</span>
            <h3>Personal Information</h3>
          </div>

          <div className="member-detail-items">
            <DetailItem
              label="Full name"
              value={member.fullName}
            />

            <DetailItem
              label="Date of birth"
              value={formatDate(
                member.dateOfBirth,
              )}
            />

            <DetailItem
              label="Current age"
              value={`${member.age} years`}
            />

            <DetailItem
              label="Gender"
              value={member.gender}
            />

            <DetailItem
              label="Phone"
              value={member.phone}
            />

            <DetailItem
              label="Email"
              value={member.email}
            />
          </div>
        </section>

        <section className="member-details-card">
          <div className="member-details-card-heading">
            <span>HEALTH</span>
            <h3>Health Information</h3>
          </div>

          <div className="member-detail-items">
            <DetailItem
              label="Blood group"
              value={
                member.bloodGroup ===
                "Unknown"
                  ? "Not available"
                  : member.bloodGroup
              }
            />

            <DetailItem
              label="Health status"
              value={
                member.healthStatus
              }
            />

            <DetailItem
              label="Allergies"
              value={member.allergies}
            />

            <DetailItem
              label="Previous diseases"
              value={member.previousDiseases}
            />

            <DetailItem
              label="Surgery history"
              value={member.surgeryHistory}
            />

            <DetailItem
              label="Living status"
              value={
                member.isLiving
                  ? "Living"
                  : "Deceased"
              }
            />
          </div>
        </section>

        {/* 🤖 AI Disease Risk Prediction Panel */}
        <section className="member-details-card full-width" style={{ gridColumn: "span 2", background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)", border: "2px solid #e2e8f0" }}>
          <div className="member-details-card-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ color: "#4f46e5", fontWeight: 800 }}>MODULE 2: AI PREDICTIVE RISK ANALYSIS</span>
              <h3 style={{ margin: "0.25rem 0 0 0", fontSize: "1.2rem", color: "#0f172a" }}>AI Health & Disease Risk Prediction</h3>
            </div>
            
            <div style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white", padding: "0.4rem 0.85rem", borderRadius: "10px", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontSize: "1.3rem" }}>{member.riskAnalysis?.compositeHealthScore || 75}</span>
              <span style={{ fontSize: "0.7rem", textTransform: "uppercase" }}>AI Health Score</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.85rem", margin: "1rem 0" }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>Diabetes Risk</span>
              <strong style={{ fontSize: "1.2rem", color: (member.riskAnalysis?.diabetesRisk || 20) > 40 ? "#dc2626" : "#059669" }}>
                {member.riskAnalysis?.diabetesRisk || 20}%
              </strong>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>Hypertension Risk</span>
              <strong style={{ fontSize: "1.2rem", color: (member.riskAnalysis?.hypertensionRisk || 25) > 40 ? "#dc2626" : "#059669" }}>
                {member.riskAnalysis?.hypertensionRisk || 25}%
              </strong>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>Cardiovascular Risk</span>
              <strong style={{ fontSize: "1.2rem", color: (member.riskAnalysis?.cardiovascularRisk || 22) > 40 ? "#dc2626" : "#059669" }}>
                {member.riskAnalysis?.cardiovascularRisk || 22}%
              </strong>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>Kidney Disease Risk</span>
              <strong style={{ fontSize: "1.2rem", color: (member.riskAnalysis?.kidneyRisk || 15) > 40 ? "#dc2626" : "#059669" }}>
                {member.riskAnalysis?.kidneyRisk || 15}%
              </strong>
            </div>
          </div>

          <div style={{ fontSize: "0.85rem", color: "#475569", background: "#f1f5f9", padding: "0.75rem 1rem", borderRadius: "8px" }}>
            💡 <strong>Recommended Specialist:</strong> <strong style={{ color: "#4338ca" }}>{member.riskAnalysis?.recommendedSpecialist || "General Physician"}</strong>
          </div>
        </section>

        <section className="member-details-card relationships-card">
          <div className="member-details-card-heading">
            <span>FAMILY TREE</span>
            <h3>Relationships</h3>
          </div>

          {connections.length > 0 ? (
            <div className="member-connections-list">
              {connections.map(
                (connection) => (
                  <article
                    className="member-connection-row"
                    key={connection.id}
                  >
                    <div>
                      <strong>
                        {
                          connection
                            .member
                            .fullName
                        }
                      </strong>

                      <span>
                        {connection.label}
                      </span>
                    </div>

                    <span className="relationship-nature-badge">
                      {connection.nature}
                    </span>
                  </article>
                ),
              )}
            </div>
          ) : (
            <div className="member-relationships-empty">
              <p>
                No family relationships recorded.
              </p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default MemberDetails;