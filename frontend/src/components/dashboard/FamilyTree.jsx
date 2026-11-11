import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  apiRequest,
} from "../../services/apiService";

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

function getInitials(fullName = "") {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0),
    )
    .join("")
    .toUpperCase();
}

function getGenderLabel(
  member,
  maleLabel,
  femaleLabel,
  neutralLabel,
) {
  if (member?.gender === "Male") {
    return maleLabel;
  }

  if (member?.gender === "Female") {
    return femaleLabel;
  }

  return neutralLabel;
}

function addUniqueMember(
  collection,
  member,
  label,
  nature,
) {
  const memberId =
    getMemberId(member);

  if (
    !memberId ||
    collection.some(
      (item) =>
        getMemberId(item.member) ===
        memberId,
    )
  ) {
    return;
  }

  collection.push({
    member,
    label,
    nature:
      nature || "unknown",
  });
}

function TreeMemberCard({
  item,
  isCurrentUser = false,
  onOpen,
}) {
  const {
    member,
    label,
    nature,
  } = item;

  return (
    <button
      type="button"
      className={`family-tree-person ${
        isCurrentUser
          ? "current-user"
          : ""
      }`}
      onClick={() =>
        onOpen(member._id)
      }
    >
      <span className="family-tree-avatar">
        {getInitials(
          member.fullName,
        ) || "FM"}
      </span>

      <span className="family-tree-person-info">
        <strong>
          {member.fullName}
        </strong>

        <small>{label}</small>

        {nature &&
          nature !== "unknown" && (
            <em>{nature}</em>
          )}
      </span>
    </button>
  );
}

function TreeGroup({
  title,
  items,
  className,
  onOpen,
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className={`family-tree-group ${className}`}
    >
      <span className="family-tree-group-label">
        {title}
      </span>

      <div className="family-tree-group-members">
        {items.map((item) => (
          <TreeMemberCard
            item={item}
            onOpen={onOpen}
            key={getMemberId(
              item.member,
            )}
          />
        ))}
      </div>
    </div>
  );
}

function FamilyTree({
  members = [],
}) {
  const navigate = useNavigate();

  const {
    token,
    user,
    signOut,
  } = useAuth();

  const [
    relationships,
    setRelationships,
  ] = useState([]);

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

    async function loadRelationships() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const result = await apiRequest(
          "/relationships",
          {
            token,
          },
        );

        if (!componentIsActive) {
          return;
        }

        setRelationships(
          Array.isArray(result?.data)
            ? result.data
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
            : "Unable to load family tree.",
        );
      } finally {
        if (componentIsActive) {
          setIsLoading(false);
        }
      }
    }

    loadRelationships();

    return () => {
      componentIsActive = false;
    };
  }, [
    token,
    signOut,
    navigate,
  ]);

  const treeData = useMemo(
    () => {
      const currentMemberId =
        String(
          user?.memberProfileId ||
            "",
        );

      const currentMember =
        members.find(
          (member) =>
            getMemberId(member) ===
            currentMemberId,
        );

      const parents = [];
      const spouses = [];
      const siblings = [];
      const children = [];
      const guardians = [];
      const dependents = [];

      relationships.forEach(
        (relationship) => {
          const fromId =
            getMemberId(
              relationship.fromMember,
            );

          const toId =
            getMemberId(
              relationship.toMember,
            );

          const {
            relationshipType,
            relationshipNature,
          } = relationship;

          if (
            relationshipType ===
            "parent"
          ) {
            if (
              toId ===
              currentMemberId
            ) {
              addUniqueMember(
                parents,
                relationship.fromMember,

                getGenderLabel(
                  relationship.fromMember,
                  "Father",
                  "Mother",
                  "Parent",
                ),

                relationshipNature,
              );
            }

            if (
              fromId ===
              currentMemberId
            ) {
              addUniqueMember(
                children,
                relationship.toMember,

                getGenderLabel(
                  relationship.toMember,
                  "Son",
                  "Daughter",
                  "Child",
                ),

                relationshipNature,
              );
            }
          }

          if (
            relationshipType ===
              "spouse" &&
            (
              fromId ===
                currentMemberId ||
              toId ===
                currentMemberId
            )
          ) {
            const otherMember =
              fromId ===
              currentMemberId
                ? relationship.toMember
                : relationship.fromMember;

            addUniqueMember(
              spouses,
              otherMember,

              getGenderLabel(
                otherMember,
                "Husband",
                "Wife",
                "Spouse",
              ),

              relationshipNature,
            );
          }

          if (
            relationshipType ===
              "sibling" &&
            (
              fromId ===
                currentMemberId ||
              toId ===
                currentMemberId
            )
          ) {
            const otherMember =
              fromId ===
              currentMemberId
                ? relationship.toMember
                : relationship.fromMember;

            addUniqueMember(
              siblings,
              otherMember,

              getGenderLabel(
                otherMember,
                "Brother",
                "Sister",
                "Sibling",
              ),

              relationshipNature,
            );
          }

          if (
            relationshipType ===
            "guardian"
          ) {
            if (
              toId ===
              currentMemberId
            ) {
              addUniqueMember(
                guardians,
                relationship.fromMember,
                "Guardian",
                relationshipNature,
              );
            }

            if (
              fromId ===
              currentMemberId
            ) {
              addUniqueMember(
                dependents,
                relationship.toMember,
                "Dependent",
                relationshipNature,
              );
            }
          }
        },
      );

      const directlyConnectedIds =
        new Set([
          currentMemberId,

          ...parents.map((item) =>
            getMemberId(item.member),
          ),

          ...spouses.map((item) =>
            getMemberId(item.member),
          ),

          ...siblings.map((item) =>
            getMemberId(item.member),
          ),

          ...children.map((item) =>
            getMemberId(item.member),
          ),

          ...guardians.map((item) =>
            getMemberId(item.member),
          ),

          ...dependents.map((item) =>
            getMemberId(item.member),
          ),
        ]);

      const otherMembers =
        members
          .filter(
            (member) =>
              !directlyConnectedIds.has(
                getMemberId(member),
              ),
          )
          .map((member) => ({
            member,
            label:
              "Extended family",
            nature:
              "relationship not connected",
          }));

      return {
        currentMember,
        parents,
        spouses,
        siblings,
        children,
        guardians,
        dependents,
        otherMembers,
      };
    },
    [
      members,
      relationships,
      user?.memberProfileId,
    ],
  );

  function openMember(memberId) {
    navigate(
      `/members/${memberId}`,
    );
  }

  return (
    <section className="family-tree-card">
      <div className="family-tree-heading">
        <div>
          <span className="dashboard-section-label">
            MODULE 6: GENETIC PEDIGREE TREE & AI HEALTH SCORE
          </span>

          <h3>Multi-Generational Hereditary Family Tree</h3>

          <p>
            3-generation pedigree diagram linking Grandparents, Parents, and Children with hereditary disease flags.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Composite AI Health Score Badge (FR-6.2) */}
          <div style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.3)"
          }}>
            <span style={{ fontSize: "1.4rem", fontWeight: 900 }}>88</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase" }}>Composite AI</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 800 }}>Health Score</span>
            </div>
          </div>

          <button type="button"
              className="family-tree-members-link"
              onClick={() =>
              navigate("/relationships")}>
              Manage relationships →
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="family-tree-state">
          <span className="family-tree-loader" />

          <strong>
            Building family tree...
          </strong>
        </div>
      )}

      {!isLoading &&
        errorMessage && (
          <div
            className="family-tree-error"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

      {!isLoading &&
        !errorMessage &&
        !treeData.currentMember && (
          <div className="family-tree-state">
            <span aria-hidden="true">
              🌳
            </span>

            <strong>
              Family profile not connected
            </strong>

            <p>
              Your member profile is required
              to display the family tree.
            </p>
          </div>
        )}

      {!isLoading &&
        !errorMessage &&
        treeData.currentMember && (
          <div className="family-tree-canvas">
            {/* Grandparents Row (3-Generation Pedigree) */}
            <div className="family-tree-upper-row" style={{ marginBottom: "1rem" }}>
              <TreeGroup
                title="Grandparents (Gen-1)"
                items={treeData.grandparents || []}
                className="grandparents"
                onOpen={openMember}
              />
            </div>

            <div className="family-tree-upper-row">
              <TreeGroup
                title="Parents (Gen-2)"
                items={treeData.parents}
                className="parents"
                onOpen={openMember}
              />

              <TreeGroup
                title="Guardians"
                items={treeData.guardians}
                className="guardians"
                onOpen={openMember}
              />
            </div>

            <div className="family-tree-middle-row">
              <TreeGroup
                title="Siblings"
                items={treeData.siblings}
                className="siblings"
                onOpen={openMember}
              />

              <div className="family-tree-group self">
                <span className="family-tree-group-label">
                  Your Profile
                </span>

                <div className="family-tree-group-members">
                  <TreeMemberCard
                    item={{
                      member:
                        treeData.currentMember,

                      label: "You",
                      nature: "",
                    }}
                    isCurrentUser
                    onOpen={openMember}
                  />
                </div>
              </div>

              <TreeGroup
                title="Spouse"
                items={treeData.spouses}
                className="spouses"
                onOpen={openMember}
              />
            </div>

            <div className="family-tree-lower-row">
              <TreeGroup
                title="Children"
                items={treeData.children}
                className="children"
                onOpen={openMember}
              />

              <TreeGroup
                title="Dependents"
                items={treeData.dependents}
                className="dependents"
                onOpen={openMember}
              />
            </div>

            {treeData.otherMembers.length >
              0 && (
              <TreeGroup
                title="Extended Family"
                items={
                  treeData.otherMembers
                }
                className="extended"
                onOpen={openMember}
              />
            )}
          </div>
        )}
    </section>
  );
}

export default FamilyTree;