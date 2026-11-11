import DashboardPreview from "./DashboardPreview";

function getStartedDestination() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  return token || user ? "/dashboard" : "/login";
}

function HeroSection() {
  const destination = getStartedDestination();

  return (
    <section className="hero" id="home">
      <div className="hero-content">
        <span className="hero-label">FAMILY HEALTH MONITORING</span>

        <h1>
          Your Family&apos;s Health,
          <span>All in One Place</span>
        </h1>

        <p>
          Keep your family&apos;s health information organized, monitor
          important health records, and access essential health information
          from one centralized platform.
        </p>

        <div className="hero-buttons">
          <a href={destination} className="primary-button">
            Get Started
          </a>

          <a href="#features" className="secondary-button">
            Explore Features
          </a>
        </div>

        <div className="hero-note">
          <span aria-hidden="true">✓</span>
          {" Simple • Organized • Family-Centered"}
        </div>
      </div>

      <DashboardPreview />
    </section>
  );
}

export default HeroSection;