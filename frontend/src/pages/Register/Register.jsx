import AuthBrand, {
  MobileAuthBrand,
} from "../../components/auth/AuthBrand";

import RegisterForm from "../../components/auth/RegisterForm";

import "../Login/Login.css";
import "./Register.css";

function Register() {
  return (
    <main className="login-page register-page">
      <AuthBrand />

      <section className="login-form-section register-form-section">
        <div className="login-form-wrapper register-form-wrapper">
          <MobileAuthBrand />

          <div className="login-top-badge">
            <span aria-hidden="true">✨</span>
            Create your family health space
          </div>

          <div className="login-header register-header">
            <h2>Let&apos;s get started!</h2>

            <p>
              Create your account to organize your family&apos;s health
              information in one secure place.
            </p>
          </div>

          <RegisterForm />

          <div className="login-security-note">
            <span className="security-icon" aria-hidden="true">
              🔐
            </span>

            <span>
              Your role is assigned securely from your date of birth
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Register;