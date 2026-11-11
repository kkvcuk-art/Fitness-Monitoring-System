function formatRecordDate(value) {
  if (!value) {
    return "Date not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date not available";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

function getStatusClass(status = "") {
  const normalizedStatus =
    String(status).toLowerCase();

  if (
    normalizedStatus === "normal" ||
    normalizedStatus === "good"
  ) {
    return "normal";
  }

  if (
    normalizedStatus === "high" ||
    normalizedStatus === "critical"
  ) {
    return "critical";
  }

  return "attention";
}

function RecentRecords({
  reports = [],
  loading = false,
}) {
  const visibleReports =
    reports.slice(0, 5);

  return (
    <section className="dashboard-section-card">
      <div className="dashboard-section-header">
        <div>
          <span className="dashboard-section-label">
            HEALTH RECORDS
          </span>

          <h2>Recent Medical Records</h2>

          <p>
            Latest recorded health information.
          </p>
        </div>

        <button
          type="button"
          className="section-view-button"
          disabled
          title="Medical Reports page will be added next"
        >
          View all
        </button>
      </div>

      <div className="recent-records-list">
        {loading &&
          Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              className="recent-record-row loading-record"
              key={index}
            >
              <span className="record-icon skeleton" />

              <div className="record-main-info">
                <span className="skeleton skeleton-line" />
                <span className="skeleton skeleton-line small" />
              </div>
            </div>
          ))}

        {!loading &&
          visibleReports.map((report) => (
            <article
              className="recent-record-row"
              key={report._id}
            >
              <span
                className="record-icon"
                aria-hidden="true"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M6 3H16L20 7V21H6V3Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />

                  <path
                    d="M16 3V8H20M9 12H17M9 16H14"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>

              <div className="record-main-info">
                <strong>
                  {report.recordType ||
                    "Medical record"}
                </strong>

                <span>
                  {report.memberName ||
                    "Family member"}
                  {" · "}
                  {formatRecordDate(
                    report.recordDate,
                  )}
                </span>
              </div>

              <strong className="record-value">
                {report.value || "—"}
              </strong>

              <span
                className={`record-status ${getStatusClass(
                  report.status,
                )}`}
              >
                {report.status || "Not set"}
              </span>
            </article>
          ))}

        {!loading &&
          visibleReports.length === 0 && (
            <div className="dashboard-empty-state">
              <span aria-hidden="true">
                📋
              </span>

              <strong>
                No medical records yet
              </strong>

              <p>
                Recent health records will appear
                here after they are added.
              </p>
            </div>
          )}
      </div>
    </section>
  );
}

export default RecentRecords;