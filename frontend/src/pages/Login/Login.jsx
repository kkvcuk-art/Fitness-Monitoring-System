import AuthBrand, {
  MobileAuthBrand,
} from "../../components/auth/AuthBrand";

import LoginForm from "../../components/auth/LoginForm";

import "./Login.css";

function Login() {
  return (
    <main className="login-page">
      <AuthBrand />

      <section className="login-form-section">
        <div className="mobile-background-shape" aria-hidden="true" />

        <div className="login-form-wrapper">
          <MobileAuthBrand />

          <div className="login-top-badge">
            <span aria-hidden="true">✨</span>
            Welcome to your health space
          </div>

          <div className="login-header">
            <h2>Welcome back!</h2>

            <p>
              Your family&apos;s health dashboard missed you. Log in to
              continue.
            </p>
          </div>

          <LoginForm />

          <div className="login-security-note">
            <span className="security-icon" aria-hidden="true">
              🔐
            </span>

            <span>Your information is securely protected</span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;