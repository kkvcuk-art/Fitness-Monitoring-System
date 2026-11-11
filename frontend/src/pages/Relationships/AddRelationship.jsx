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

import "./AddRelationship.css";

const initialFormData = {
  fromMember: "",
  toMember: "",
  relationshipType: "parent",
  relationshipNature: "biological",
  notes: "",
};

const relationshipTypes = [
  {
    value: "parent",
    label: "Parent → Child",
  },
  {
    value: "spouse",
    label: "Spouse ↔ Spouse",
  },
  {
    value: "sibling",
    label: "Sibling ↔ Sibling",
  },
  {
    value: "guardian",
    label: "Guardian → Dependent",
  },
];

const relationshipNatures = [
  "biological",
  "adoptive",
  "step",
  "marital",
  "guardian",
  "unknown",
];

function getMemberName(
  members,
  memberId,
) {
  return (
    members.find(
      (member) =>
        member._id === memberId,
    )?.fullName || ""
  );
}

function AddRelationship() {
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

        if (
          familyMembers.length >= 2
        ) {
          setFormData(
            (currentData) => ({
              ...currentData,

              fromMember:
                currentData.fromMember ||
                familyMembers[0]._id,

              toMember:
                currentData.toMember ||
                familyMembers[1]._id,
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

  const availableToMembers =
    useMemo(
      () =>
        members.filter(
          (member) =>
            member._id !==
            formData.fromMember,
        ),
      [
        members,
        formData.fromMember,
      ],
    );

  const relationshipPreview =
    useMemo(() => {
      const fromName =
        getMemberName(
          members,
          formData.fromMember,
        ) || "First member";

      const toName =
        getMemberName(
          members,
          formData.toMember,
        ) || "Second member";

      if (
        formData.relationshipType ===
        "parent"
      ) {
        return `${fromName} is the parent of ${toName}.`;
      }

      if (
        formData.relationshipType ===
        "spouse"
      ) {
        return `${fromName} and ${toName} are spouses.`;
      }

      if (
        formData.relationshipType ===
        "sibling"
      ) {
        return `${fromName} and ${toName} are siblings.`;
      }

      if (
        formData.relationshipType ===
        "guardian"
      ) {
        return `${fromName} is the guardian of ${toName}.`;
      }

      return "";
    }, [
      members,
      formData.fromMember,
      formData.toMember,
      formData.relationshipType,
    ]);

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (currentData) => {
        const nextData = {
          ...currentData,
          [name]: value,
        };

        if (
          name === "fromMember" &&
          value ===
            currentData.toMember
        ) {
          nextData.toMember = "";
        }

        if (
          name ===
          "relationshipType"
        ) {
          if (value === "spouse") {
            nextData.relationshipNature =
              "marital";
          }

          if (value === "guardian") {
            nextData.relationshipNature =
              "guardian";
          }

          if (
            value === "parent" &&
            (
              currentData.relationshipNature ===
                "marital" ||
              currentData.relationshipNature ===
                "guardian"
            )
          ) {
            nextData.relationshipNature =
              "biological";
          }

          if (
            value === "sibling" &&
            (
              currentData.relationshipNature ===
                "marital" ||
              currentData.relationshipNature ===
                "guardian"
            )
          ) {
            nextData.relationshipNature =
              "biological";
          }
        }

        return nextData;
      },
    );

    if (errorMessage) {
      setErrorMessage("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canModifyInformation) {
      setErrorMessage(
        "You have view-only access and cannot create family relationships.",
      );

      return;
    }

    if (
      !formData.fromMember ||
      !formData.toMember ||
      !formData.relationshipType
    ) {
      setErrorMessage(
        "Please select both family members and the relationship type.",
      );

      return;
    }

    if (
      formData.fromMember ===
      formData.toMember
    ) {
      setErrorMessage(
        "A person cannot have a relationship with themselves.",
      );

      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await apiRequest(
        "/relationships",
        {
          method: "POST",
          token,

          body: {
            fromMember:
              formData.fromMember,

            toMember:
              formData.toMember,

            relationshipType:
              formData.relationshipType,

            relationshipNature:
              formData.relationshipNature,

            notes:
              formData.notes.trim(),
          },
        },
      );

      navigate(
        "/relationships",
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
          : "Unable to add family relationship.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const natureIsLocked =
    formData.relationshipType ===
      "spouse" ||
    formData.relationshipType ===
      "guardian";

  return (
    <DashboardLayout>
      <section className="add-relationship-page-header">
        <button
          type="button"
          className="add-relationship-back-link"
          onClick={() =>
            navigate("/relationships")
          }
        >
          ← Relationship Manager
        </button>

        <h2>Add Relationship</h2>

        <p>
          Connect two existing family members
          to expand the multi-generation family
          tree.
        </p>
      </section>

      {errorMessage && (
        <div
          className="add-relationship-error"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {!canModifyInformation && (
        <div
          className="add-relationship-warning"
          role="alert"
        >
          Your account has view-only access.
          Only a Health Manager can create
          family relationships.
        </div>
      )}

      {!isLoadingMembers &&
        members.length < 2 && (
          <div
            className="add-relationship-warning"
            role="alert"
          >
            At least two family members are
            required. Add another family member
            before creating a relationship.
          </div>
        )}

      <form
        className="add-relationship-form"
        onSubmit={handleSubmit}
      >
        <section className="add-relationship-card">
          <div className="add-relationship-section-heading">
            <span>01</span>

            <div>
              <h3>
                Select family members
              </h3>

              <p>
                Direction matters for parent
                and guardian relationships.
              </p>
            </div>
          </div>

          <div className="add-relationship-divider" />

          <div className="add-relationship-grid">
            <div className="add-relationship-field">
              <label htmlFor="fromMember">
                First member *
              </label>

              <select
                id="fromMember"
                name="fromMember"
                value={formData.fromMember}
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
                    : "Select first member"}
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

            <div className="add-relationship-direction">
              <span aria-hidden="true">
                →
              </span>

              <small>
                Relationship direction
              </small>
            </div>

            <div className="add-relationship-field">
              <label htmlFor="toMember">
                Second member *
              </label>

              <select
                id="toMember"
                name="toMember"
                value={formData.toMember}
                onChange={handleChange}
                disabled={
                  isLoadingMembers ||
                  isSubmitting ||
                  !canModifyInformation ||
                  !formData.fromMember
                }
                required
              >
                <option value="">
                  Select second member
                </option>

                {availableToMembers.map(
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
          </div>
        </section>

        <section className="add-relationship-card">
          <div className="add-relationship-section-heading">
            <span>02</span>

            <div>
              <h3>
                Relationship details
              </h3>

              <p>
                Select the type and nature of
                this family connection.
              </p>
            </div>
          </div>

          <div className="add-relationship-divider" />

          <div className="add-relationship-grid relationship-details-grid">
            <div className="add-relationship-field">
              <label htmlFor="relationshipType">
                Relationship type *
              </label>

              <select
                id="relationshipType"
                name="relationshipType"
                value={
                  formData.relationshipType
                }
                onChange={handleChange}
                disabled={
                  isSubmitting ||
                  !canModifyInformation
                }
                required
              >
                {relationshipTypes.map(
                  (type) => (
                    <option
                      value={type.value}
                      key={type.value}
                    >
                      {type.label}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="add-relationship-field">
              <label htmlFor="relationshipNature">
                Relationship nature *
              </label>

              <select
                id="relationshipNature"
                name="relationshipNature"
                value={
                  formData.relationshipNature
                }
                onChange={handleChange}
                disabled={
                  isSubmitting ||
                  !canModifyInformation ||
                  natureIsLocked
                }
                required
              >
                {relationshipNatures.map(
                  (nature) => (
                    <option
                      value={nature}
                      key={nature}
                    >
                      {nature
                        .charAt(0)
                        .toUpperCase() +
                        nature.slice(1)}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="add-relationship-field add-relationship-field-full">
              <label htmlFor="notes">
                Notes
              </label>

              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Optional information about this relationship"
                rows="4"
                maxLength="500"
                disabled={
                  isSubmitting ||
                  !canModifyInformation
                }
              />
            </div>
          </div>

          <div className="relationship-preview">
            <span>
              Relationship preview
            </span>

            <strong>
              {relationshipPreview}
            </strong>
          </div>
        </section>

        <section className="add-relationship-actions">
          <button
            type="button"
            className="add-relationship-cancel-button"
            onClick={() =>
              navigate("/relationships")
            }
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="add-relationship-submit-button"
            disabled={
              isSubmitting ||
              isLoadingMembers ||
              members.length < 2 ||
              !canModifyInformation
            }
          >
            {isSubmitting
              ? "Connecting members..."
              : "Add Relationship"}
          </button>
        </section>
      </form>
    </DashboardLayout>
  );
}

export default AddRelationship;