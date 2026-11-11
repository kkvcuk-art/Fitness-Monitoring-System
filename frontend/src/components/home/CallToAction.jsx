function getStartedDestination() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  return token || user ? "/dashboard" : "/login";
}

function CallToAction() {
  return (
    <section className="cta-section">
      <div className="section-container">
        <div className="cta" id="contact">
          <div className="cta-content">
            <span className="section-label">GET STARTED</span>

            <h2>Start Managing Your Family&apos;s Health</h2>

            <p>
              Keep important family health information organized and
              accessible in one place.
            </p>
          </div>

          <a href={getStartedDestination()} className="cta-button">
            Get Started
          </a>
        </div>
      </div>
    </section>
  );
}

export default CallToAction;