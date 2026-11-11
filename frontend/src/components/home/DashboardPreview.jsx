function DashboardPreview() {
  return (
    <div className="hero-visual" aria-label="Health dashboard preview">
      <div className="dashboard-preview">
        <div className="preview-header">
          <div>
            <span className="preview-label">HEALTH OVERVIEW</span>
            <h3>Family Dashboard</h3>
          </div>

          <span className="status-indicator">
            <span />
            Preview
          </span>
        </div>

        <div className="preview-stats">
          <div className="preview-stat">
            <span className="stat-icon" aria-hidden="true">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M16 21V19C16 16.8 14.2 15 12 15H6C3.8 15 2 16.8 2 19V21"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />

                <circle
                  cx="9"
                  cy="7"
                  r="4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />

                <path
                  d="M19 8V14M16 11H22"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>

            <div>
              <small>Family Members</small>
              <strong>0</strong>
            </div>
          </div>

          <div className="preview-stat">
            <span className="stat-icon" aria-hidden="true">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M4 19V5M4 19H20"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />

                <path
                  d="M7 15L10 11L13 13L18 7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>

            <div>
              <small>Health Records</small>
              <strong>0</strong>
            </div>
          </div>
        </div>

        <div className="health-summary">
          <div className="summary-heading">
            <h4>Recent Health Records</h4>
            <a href="/login">View All</a>
          </div>

          <div className="health-record">
            <div className="member-avatar">...</div>

            <div className="record-person">
              <strong>No records available</strong>
              <small>Add records after signing in</small>
            </div>

            <div className="record-value">
              <strong>-</strong>
              <small>-</small>
            </div>
          </div>
        </div>

        <div className="health-status-card">
          <div className="health-status-icon" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M20 12C20 16.4 16.4 20 12 20C7.6 20 4 16.4 4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12Z"
                stroke="currentColor"
                strokeWidth="1.8"
              />

              <path
                d="M8 12.5L10.5 15L16 9.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div>
            <strong>Family Health Status</strong>
            <small>Sign in to connect your health records</small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPreview;