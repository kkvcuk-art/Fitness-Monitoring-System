import { Link } from "react-router";

function Logo() {
  return (
    <span className="auth-logo-icon" aria-hidden="true">
      <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
        <rect width="42" height="42" rx="13" fill="currentColor" />

        <path
          d="M21 31C20.6 30.6 11.5 24 11.5 17.2C11.5 13.7 14.1 11.2 17.2 11.2C18.8 11.2 20.2 12 21 13.3C21.8 12 23.2 11.2 24.8 11.2C27.9 11.2 30.5 13.7 30.5 17.2C30.5 24 21.4 30.6 21 31Z"
          fill="white"
        />

        <path
          d="M21 15.5V23.5M17 19.5H25"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function MobileAuthBrand() {
  return (
    <Link to="/" className="mobile-auth-brand">
      <Logo />

      <span className="auth-logo-text">
        <strong>Family Health</strong>
        <small>Monitoring System</small>
      </span>
    </Link>
  );
}

function AuthBrand() {
  const trustPoints = [
    {
      icon: "🔒",
      title: "Private",
      description: "Your health data stays protected",
    },
    {
      icon: "⚡",
      title: "Simple",
      description: "Everything accessible in seconds",
    },
    {
      icon: "👨‍👩‍👧‍👦",
      title: "Connected",
      description: "One health space for the family",
    },
  ];

  return (
    <section className="auth-info">
      <div className="auth-glow auth-glow-one" aria-hidden="true" />
      <div className="auth-glow auth-glow-two" aria-hidden="true" />

      <div className="floating-shape shape-one" aria-hidden="true">
        +
      </div>

      <div className="floating-shape shape-two" aria-hidden="true">
        ♡
      </div>

      <Link to="/" className="auth-logo">
        <Logo />

        <span className="auth-logo-text">
          <strong>Family Health</strong>
          <small>MONITORING SYSTEM</small>
        </span>
      </Link>

      <div className="auth-info-content">
        <div className="auth-status-pill">
          <span className="status-dot" />
          Your family health space
        </div>

        <h1>
          Care smarter.
          <br />
          Live <span>healthier.</span>
        </h1>

        <p className="auth-description">
          Keep your family&apos;s health records organized, secure and always
          within reach.
        </p>

        <div className="auth-trust-grid">
          {trustPoints.map((point) => (
            <article className="auth-trust-card" key={point.title}>
              <span className="trust-icon" aria-hidden="true">
                {point.icon}
              </span>

              <div>
                <h2>{point.title}</h2>
                <p>{point.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="auth-panel-footer">
        <span>Built for modern families</span>
        <span className="footer-separator">•</span>
        <span>Phase 1 MVP</span>
      </div>
    </section>
  );
}

export default AuthBrand;