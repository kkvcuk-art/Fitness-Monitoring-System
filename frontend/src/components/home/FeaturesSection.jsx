const features = [
  {
    number: "01",
    type: "members",
    title: "Family Members",
    description:
      "Manage basic information about your family members in one centralized place.",
  },
  {
    number: "02",
    type: "records",
    title: "Health Records",
    description:
      "Record important health measurements such as blood pressure, blood sugar, weight and other basic health information.",
  },
  {
    number: "03",
    type: "overview",
    title: "Health Overview",
    description:
      "View a simple overview of your family's health information from a centralized dashboard.",
  },
  {
    number: "04",
    type: "history",
    title: "Family Health History",
    description:
      "Maintain important information about diseases and health history within the family.",
  },
];

function FeatureIcon({ type }) {
  if (type === "members") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
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
    );
  }

  if (type === "records") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
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
    );
  }

  if (type === "overview") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <rect
          x="3"
          y="4"
          width="18"
          height="16"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M7 16L10 12L13 14L17 9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle
        cx="7"
        cy="7"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="17"
        cy="7"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="17"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9.5 8.5L11 15M14.5 8.5L13 15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FeaturesSection() {
  return (
    <section className="features-section" id="features">
      <div className="section-container">
        <div className="section-heading centered">
          <span className="section-label">CORE FEATURES</span>

          <h2>Everything Your Family Needs</h2>

          <p>
            The Phase 1 MVP focuses on making basic family health information
            simple to manage and access.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <div className="feature-icon" aria-hidden="true">
                <FeatureIcon type={feature.type} />
              </div>

              <span className="feature-number">{feature.number}</span>

              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;