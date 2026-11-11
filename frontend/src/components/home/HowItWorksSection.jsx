const steps = [
  {
    number: "01",
    type: "members",
    title: "Add Family Members",
    description:
      "Add the family members whose basic health information you want to manage.",
  },
  {
    number: "02",
    type: "records",
    title: "Record Health Information",
    description:
      "Store important health measurements and basic medical information.",
  },
  {
    number: "03",
    type: "monitor",
    title: "Monitor Your Family's Health",
    description:
      "View your family's information from a centralized dashboard.",
  },
];

function StepIcon({ type }) {
  if (type === "members") {
    return (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
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
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3V21M3 12H21"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <path
          d="M5 6H19V18H5V6Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
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

function HowItWorksSection() {
  return (
    <section className="how-it-works-section" id="how-it-works">
      <div className="section-container">
        <div className="section-heading centered">
          <span className="section-label">HOW IT WORKS</span>

          <h2>Simple. Organized. Accessible.</h2>

          <p>
            Manage your family&apos;s basic health information in three simple
            steps.
          </p>
        </div>

        <div className="steps-grid">
          {steps.map((step) => (
            <article className="step-card" key={step.number}>
              <div className="step-number">{step.number}</div>

              <div className="step-icon" aria-hidden="true">
                <StepIcon type={step.type} />
              </div>

              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;