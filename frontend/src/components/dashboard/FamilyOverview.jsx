function getInitials(fullName = "") {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function getHealthStatusClass(
  status = "",
) {
  const normalizedStatus =
    String(status).toLowerCase();

  if (
    normalizedStatus === "good"
  ) {
    return "good";
  }

  if (
    normalizedStatus === "critical"
  ) {
    return "critical";
  }

  return "attention";
}

function FamilyOverview({
  members = [],
  loading = false,
}) {
  const visibleMembers =
    members.slice(0, 4);

  return (
    <section className="dashboard-section-card">
      <div className="dashboard-section-header">
        <div>
          <span className="dashboard-section-label">
            FAMILY
          </span>

          <h2>Family Overview</h2>

          <p>
            Recently added family profiles.
          </p>
        </div>

        <button
          type="button"
          className="section-view-button"
          disabled
          title="Family Members page will be connected next"
        >
          View all
        </button>
      </div>

      <div className="family-overview-list">
        {loading &&
          Array.from({
            length: 3,
          }).map((_, index) => (
            <div
              className="family-member-row loading-row"
              key={index}
            >
              <span className="member-avatar skeleton" />

              <div className="member-main-info">
                <span className="skeleton skeleton-line" />
                <span className="skeleton skeleton-line small" />
              </div>
            </div>
          ))}

        {!loading &&
          visibleMembers.map((member) => (
            <article
              className="family-member-row"
              key={member._id}
            >
              <span className="member-avatar">
                {getInitials(
                  member.fullName,
                ) || "FM"}
              </span>

              <div className="member-main-info">
                <strong>
                  {member.fullName}
                </strong>

                <span>
                  {member.linkedUser
                    ? "Account owner"
                    : "Family member"}
                </span>
              </div>

              <div className="member-meta">
                <span>
                  {member.age ?? "—"} years
                </span>

                <span>
                  {member.bloodGroup ===
                  "Unknown"
                    ? "Blood group N/A"
                    : member.bloodGroup}
                </span>
              </div>

              <span
                className={`member-health-status ${getHealthStatusClass(
                  member.healthStatus,
                )}`}
              >
                {member.healthStatus ||
                  "Unknown"}
              </span>
            </article>
          ))}

        {!loading &&
          visibleMembers.length === 0 && (
            <div className="dashboard-empty-state">
              <span aria-hidden="true">
                👨‍👩‍👧‍👦
              </span>

              <strong>
                No family members yet
              </strong>

              <p>
                Family profiles will appear here
                after they are added.
              </p>
            </div>
          )}
      </div>
    </section>
  );
}

export default FamilyOverview;