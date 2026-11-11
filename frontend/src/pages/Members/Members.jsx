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

import "./Members.css";

function getInitials(fullName = "") {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function getMemberId(member) {
  if (!member) {
    return "";
  }

  return String(
    typeof member === "object"
      ? member._id
      : member,
  );
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

/*
 * Calculate a member's relationship relative
 * to the logged-in user's family-tree profile.
 */
function getRelationshipToUser(
  member,
  relationships,
  userMemberProfileId,
) {
  const memberId =
    getMemberId(member);

  const userProfileId =
    String(
      userMemberProfileId || "",
    );

  if (
    memberId === userProfileId
  ) {
    return "You";
  }

  const relationship =
    relationships.find(
      (item) => {
        const fromId =
          getMemberId(
            item.fromMember,
          );

        const toId =
          getMemberId(
            item.toMember,
          );

        return (
          (
            fromId === memberId &&
            toId === userProfileId
          ) ||
          (
            fromId === userProfileId &&
            toId === memberId
          )
        );
      },
    );

  if (!relationship) {
    return "Relationship not set";
  }

  const fromId =
    getMemberId(
      relationship.fromMember,
    );

  const memberIsFrom =
    fromId === memberId;

  if (
    relationship.relationshipType ===
    "parent"
  ) {
    if (memberIsFrom) {
      return getGenderLabel(
        member.gender,
        "Father",
        "Mother",
        "Parent",
      );
    }

    return getGenderLabel(
      member.gender,
      "Son",
      "Daughter",
      "Child",
    );
  }

  if (
    relationship.relationshipType ===
    "spouse"
  ) {
    return getGenderLabel(
      member.gender,
      "Husband",
      "Wife",
      "Spouse",
    );
  }

  if (
    relationship.relationshipType ===
    "sibling"
  ) {
    return getGenderLabel(
      member.gender,
      "Brother",
      "Sister",
      "Sibling",
    );
  }

  if (
    relationship.relationshipType ===
    "guardian"
  ) {
    return memberIsFrom
      ? "Guardian"
      : "Dependent";
  }

  return "Family member";
}

function Members() {
  const navigate = useNavigate();

  const {
    token,
    user,
    canModifyInformation,
    signOut,
  } = useAuth();

  const [
    members,
    setMembers,
  ] = useState([]);

  const [
    relationships,
    setRelationships,
  ] = useState([]);

  const [
    searchText,
    setSearchText,
  ] = useState("");

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

    async function loadPageData() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [
          membersResult,
          relationshipsResult,
        ] = await Promise.all([
          apiRequest(
            "/members",
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

        setMembers(
          Array.isArray(
            membersResult?.data,
          )
            ? membersResult.data
            : [],
        );

        setRelationships(
          Array.isArray(
            relationshipsResult?.data,
          )
            ? relationshipsResult.data
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
            : "Unable to load family members.",
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
    token,
    signOut,
    navigate,
  ]);

  const membersWithRelationships =
    useMemo(
      () =>
        members.map((member) => ({
          ...member,

          relationshipLabel:
            getRelationshipToUser(
              member,
              relationships,
              user?.memberProfileId,
            ),
        })),
      [
        members,
        relationships,
        user?.memberProfileId,
      ],
    );

  const filteredMembers =
    useMemo(() => {
      const query =
        searchText
          .trim()
          .toLowerCase();

      if (!query) {
        return membersWithRelationships;
      }

      return membersWithRelationships.filter(
        (member) => {
          const searchableText = [
            member.fullName,
            member.relationshipLabel,
            member.gender,
            member.bloodGroup,
            member.healthStatus,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchableText.includes(
            query,
          );
        },
      );
    }, [
      membersWithRelationships,
      searchText,
    ]);

  return (
    <DashboardLayout>
      <section className="members-page-header">
        <div>
          <span className="dashboard-section-label">
            FAMILY PROFILES
          </span>

          <h2>Family Members</h2>

          <p>
            View your family profiles and their
            relationship to you.
          </p>
        </div>

        {canModifyInformation ? (
          <button
                type="button"
                className="members-primary-button"
                onClick={() => navigate("/members/add")}>
                <span aria-hidden="true">+</span>

                Add Family Member
            </button>
        ) : (
          <span className="members-view-only-badge">
            View-only access
          </span>
        )}
      </section>

      <section className="members-toolbar">
        <div className="members-search-field">
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
            placeholder="Search name, relationship, gender or blood group"
            aria-label="Search family members"
          />
        </div>

        <span className="members-count">
          {filteredMembers.length}{" "}
          {filteredMembers.length === 1
            ? "member"
            : "members"}
        </span>
      </section>

      {errorMessage && (
        <div
          className="members-error-message"
          role="alert"
        >
          <div>
            <strong>
              Family members could not be loaded
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

      <section className="members-list-card">
        {isLoading && (
          <div className="members-page-state">
            <span className="members-loader" />

            <strong>
              Loading family members...
            </strong>
          </div>
        )}

        {!isLoading &&
          filteredMembers.length === 0 && (
            <div className="members-page-state">
              <span
                className="members-empty-icon"
                aria-hidden="true"
              >
                👨‍👩‍👧‍👦
              </span>

              <strong>
                {searchText
                  ? "No matching family member"
                  : "No family members yet"}
              </strong>

              <p>
                {searchText
                  ? "Try a different search."
                  : "Family profiles will appear here after they are added."}
              </p>
            </div>
          )}

        {!isLoading &&
          filteredMembers.length > 0 && (
            <div className="members-table-wrapper">
              <table className="members-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Relationship</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Blood Group</th>
                    <th>AI Health Score</th>
                    <th>Health Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMembers.map(
                    (member) => (
                      <tr key={member._id}>
                        <td>
                          <div className="members-person">
                            <span className="members-avatar">
                              {getInitials(
                                member.fullName,
                              ) || "FM"}
                            </span>

                            <div>
                              <strong>
                                {member.fullName}
                              </strong>

                              <span>
                                {member.email ||
                                  "No email"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="relationship-label">
                            {member.relationshipLabel}
                          </span>
                        </td>

                        <td>
                          {member.age ?? "—"} years
                        </td>

                        <td>
                          {member.gender}
                        </td>

                        <td>
                          {member.bloodGroup ===
                          "Unknown"
                            ? "N/A"
                            : member.bloodGroup}
                        </td>

                        <td>
                          <span style={{
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: "white",
                            padding: "0.25rem 0.6rem",
                            borderRadius: "8px",
                            fontWeight: "800",
                            fontSize: "0.8rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem"
                          }}>
                            🤖 {member.riskAnalysis?.compositeHealthScore || 78} / 100
                          </span>
                        </td>

                        <td>
                          <span
                            className={`members-status ${String(
                              member.healthStatus,
                            )
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`}
                          >
                            {member.healthStatus ||
                              "Unknown"}
                          </span>
                        </td>

                        <td>
                            <button type="button" className="members-view-button" onClick={() => navigate(`/members/${member._id}`,)}>
                                View
                            </button>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
      </section>
    </DashboardLayout>
  );
}

export default Members;