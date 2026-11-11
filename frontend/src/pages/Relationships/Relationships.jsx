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

import "./Relationships.css";

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

function getMemberName(member) {
  if (
    member &&
    typeof member === "object"
  ) {
    return (
      member.fullName ||
      "Unknown member"
    );
  }

  return "Unknown member";
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

function getParentLabel(member) {
  if (member?.gender === "Male") {
    return "Father";
  }

  if (member?.gender === "Female") {
    return "Mother";
  }

  return "Parent";
}

function getSiblingLabel(member) {
  if (member?.gender === "Male") {
    return "Brother";
  }

  if (member?.gender === "Female") {
    return "Sister";
  }

  return "Sibling";
}

function getSpouseLabel(member) {
  if (member?.gender === "Male") {
    return "Husband";
  }

  if (member?.gender === "Female") {
    return "Wife";
  }

  return "Spouse";
}

function getRelationshipDescription(
  relationship,
) {
  const fromName =
    getMemberName(
      relationship.fromMember,
    );

  const toName =
    getMemberName(
      relationship.toMember,
    );

  if (
    relationship.relationshipType ===
    "parent"
  ) {
    return {
      primaryLabel:
        getParentLabel(
          relationship.fromMember,
        ),

      description:
        `${fromName} is the ${getParentLabel(
          relationship.fromMember,
        ).toLowerCase()} of ${toName}`,
    };
  }

  if (
    relationship.relationshipType ===
    "spouse"
  ) {
    return {
      primaryLabel:
        getSpouseLabel(
          relationship.fromMember,
        ),

      description:
        `${fromName} and ${toName} are spouses`,
    };
  }

  if (
    relationship.relationshipType ===
    "sibling"
  ) {
    return {
      primaryLabel:
        getSiblingLabel(
          relationship.fromMember,
        ),

      description:
        `${fromName} and ${toName} are siblings`,
    };
  }

  if (
    relationship.relationshipType ===
    "guardian"
  ) {
    return {
      primaryLabel: "Guardian",

      description:
        `${fromName} is the guardian of ${toName}`,
    };
  }

  return {
    primaryLabel:
      "Family relationship",

    description:
      `${fromName} is connected to ${toName}`,
  };
}

function Relationships() {
  const navigate = useNavigate();

  const {
    token,
    canModifyInformation,
    signOut,
  } = useAuth();

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
    deletingId,
    setDeletingId,
  ] = useState("");

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
            : "Unable to load family relationships.",
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

  const filteredRelationships =
    useMemo(() => {
      const query = searchText
        .trim()
        .toLowerCase();

      if (!query) {
        return relationships;
      }

      return relationships.filter(
        (relationship) => {
          const {
            primaryLabel,
            description,
          } =
            getRelationshipDescription(
              relationship,
            );

          const searchableText = [
            getMemberName(
              relationship.fromMember,
            ),

            getMemberName(
              relationship.toMember,
            ),

            primaryLabel,
            description,

            relationship.relationshipType,
            relationship.relationshipNature,
            relationship.notes,
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
      relationships,
      searchText,
    ]);

  async function handleRemove(
    relationship,
  ) {
    if (!canModifyInformation) {
      return;
    }

    const {
      description,
    } =
      getRelationshipDescription(
        relationship,
      );

    const shouldRemove =
      window.confirm(
        `Remove this relationship?\n\n${description}`,
      );

    if (!shouldRemove) {
      return;
    }

    setDeletingId(
      relationship._id,
    );

    setErrorMessage("");

    try {
      await apiRequest(
        `/relationships/${relationship._id}`,
        {
          method: "DELETE",
          token,
        },
      );

      setRelationships(
        (currentRelationships) =>
          currentRelationships.filter(
            (item) =>
              item._id !==
              relationship._id,
          ),
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
          : "Unable to remove family relationship.",
      );
    } finally {
      setDeletingId("");
    }
  }

  return (
    <DashboardLayout>
      <section className="relationships-page-header">
        <div>
          <span className="dashboard-section-label">
            FAMILY CONNECTIONS
          </span>

          <h2>
            Relationship Manager
          </h2>

          <p>
            Connect any two family members to
            build an accurate multi-generation
            family tree.
          </p>
        </div>

        {canModifyInformation ? (
          <button
            type="button"
            className="relationships-primary-button"
            onClick={() =>
              navigate(
                "/relationships/add",
              )
            }
          >
            <span aria-hidden="true">
              +
            </span>

            Add Relationship
          </button>
        ) : (
          <span className="relationships-view-only-badge">
            View-only access
          </span>
        )}
      </section>

      <section className="relationships-toolbar">
        <div className="relationships-search-field">
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
            placeholder="Search member, relationship or nature"
            aria-label="Search family relationships"
          />
        </div>

        <span className="relationships-count">
          {filteredRelationships.length}{" "}
          {filteredRelationships.length === 1
            ? "relationship"
            : "relationships"}
        </span>
      </section>

      {errorMessage && (
        <div
          className="relationships-error-message"
          role="alert"
        >
          <div>
            <strong>
              Relationship operation failed
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

      <section className="relationships-list-card">
        {isLoading && (
          <div className="relationships-page-state">
            <span className="relationships-loader" />

            <strong>
              Loading family relationships...
            </strong>
          </div>
        )}

        {!isLoading &&
          filteredRelationships.length ===
            0 && (
            <div className="relationships-page-state">
              <span
                className="relationships-empty-icon"
                aria-hidden="true"
              >
                🌳
              </span>

              <strong>
                {searchText
                  ? "No matching relationship"
                  : "No relationships connected yet"}
              </strong>

              <p>
                {searchText
                  ? "Try searching with different information."
                  : "Connect family members to create the multi-generation family tree."}
              </p>

              {!searchText &&
                canModifyInformation && (
                  <button
                    type="button"
                    className="relationships-empty-button"
                    onClick={() =>
                      navigate(
                        "/relationships/add",
                      )
                    }
                  >
                    Add first relationship
                  </button>
                )}
            </div>
          )}

        {!isLoading &&
          filteredRelationships.length >
            0 && (
            <div className="relationships-grid">
              {filteredRelationships.map(
                (relationship) => {
                  const fromMember =
                    relationship.fromMember;

                  const toMember =
                    relationship.toMember;

                  const {
                    primaryLabel,
                    description,
                  } =
                    getRelationshipDescription(
                      relationship,
                    );

                  return (
                    <article
                      className="relationship-card"
                      key={
                        relationship._id
                      }
                    >
                      <div className="relationship-card-people">
                        <button
                          type="button"
                          className="relationship-person"
                          onClick={() =>
                            navigate(
                              `/members/${getMemberId(
                                fromMember,
                              )}`,
                            )
                          }
                        >
                          <span className="relationship-avatar">
                            {getInitials(
                              getMemberName(
                                fromMember,
                              ),
                            ) || "FM"}
                          </span>

                          <strong>
                            {getMemberName(
                              fromMember,
                            )}
                          </strong>
                        </button>

                        <div className="relationship-connection">
                          <span />

                          <strong>
                            {primaryLabel}
                          </strong>

                          <span />
                        </div>

                        <button
                          type="button"
                          className="relationship-person"
                          onClick={() =>
                            navigate(
                              `/members/${getMemberId(
                                toMember,
                              )}`,
                            )
                          }
                        >
                          <span className="relationship-avatar">
                            {getInitials(
                              getMemberName(
                                toMember,
                              ),
                            ) || "FM"}
                          </span>

                          <strong>
                            {getMemberName(
                              toMember,
                            )}
                          </strong>
                        </button>
                      </div>

                      <p className="relationship-description">
                        {description}
                      </p>

                      <div className="relationship-card-footer">
                        <span className="relationship-nature">
                          {relationship.relationshipNature ||
                            "unknown"}
                        </span>

                        {canModifyInformation && (
                          <button
                            type="button"
                            className="relationship-remove-button"
                            onClick={() =>
                              handleRemove(
                                relationship,
                              )
                            }
                            disabled={
                              deletingId ===
                              relationship._id
                            }
                          >
                            {deletingId ===
                            relationship._id
                              ? "Removing..."
                              : "Remove"}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}
      </section>
    </DashboardLayout>
  );
}

export default Relationships;