import { useState } from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router";

import PasswordInput from "./PasswordInput";

import {
  loginUser,
} from "../../services/authService";

import {
  useAuth,
} from "../../context/AuthContext";

/* =========================================================
   EMAIL ICON
   ========================================================= */

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M4 7L12 13L20 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =========================================================
   ARROW ICON
   ========================================================= */

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12H19M14 7L19 12L14 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =========================================================
   LOGIN FORM
   ========================================================= */

function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();

  /*
   * Auth Context ka signIn function.
   * Ye JWT aur user ko storage aur context mein save karega.
   */
  const { signIn } = useAuth();

  /*
   * Register page se aaya hua data.
   */
  const registrationData =
    location.state?.registrationSuccess
      ? location.state
      : null;

  /*
   * Form values.
   * Registration ke baad email automatically fill hoga.
   */
  const [formData, setFormData] =
    useState({
      email:
        registrationData?.email || "",

      password: "",

      rememberMe: false,
    });

  /*
   * Registration success ya login error message.
   */
  const [message, setMessage] =
    useState(
      registrationData
        ? `${registrationData.message}. Please login to continue.`
        : "",
    );

  const [messageType, setMessageType] =
    useState(
      registrationData
        ? "success"
        : "error",
    );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  /* =======================================================
     HANDLE INPUT CHANGE
     ======================================================= */

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((currentData) => ({
      ...currentData,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    if (
      messageType === "error" &&
      message
    ) {
      setMessage("");
    }
  }

  /* =======================================================
     HANDLE LOGIN
     ======================================================= */

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setMessage("");
    setMessageType("error");

    const email =
      formData.email.trim();

    if (!email || !formData.password) {
      setMessage(
        "Please enter your email address and password.",
      );

      return;
    }

    if (formData.password.length < 6) {
      setMessage(
        "Password must contain at least 6 characters.",
      );

      return;
    }

    setIsSubmitting(true);

    try {
      /*
       * Send email and password to backend.
       */
      const result = await loginUser({
        email,
        password: formData.password,
      });

      /*
       * Save JWT and user through Auth Context.
       */
      signIn({
        token: result.token,
        user: result.user,
        rememberMe:
          formData.rememberMe,
      });

      /*
       * Open dashboard after successful login.
       */
      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /* =======================================================
     FORM UI
     ======================================================= */

  return (
    <form
      className="login-form"
      onSubmit={handleSubmit}
      noValidate
    >
      {message && (
        <div
          className={`auth-message ${messageType}`}
          role={
            messageType === "error"
              ? "alert"
              : "status"
          }
          aria-live="polite"
        >
          {message}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="email">
          Email address
        </label>

        <div className="input-container">
          <span
            className="input-icon"
            aria-hidden="true"
          >
            <EmailIcon />
          </span>

          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isSubmitting}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <div className="form-label-row">
          <label htmlFor="password">
            Password
          </label>

          <Link
            to="/forgot-password"
            className="forgot-link"
          >
            Forgot password?
          </Link>
        </div>

        <PasswordInput
          value={formData.password}
          onChange={handleChange}
          disabled={isSubmitting}
        />
      </div>

      <label className="checkbox-label">
        <input
          type="checkbox"
          name="rememberMe"
          checked={formData.rememberMe}
          onChange={handleChange}
          disabled={isSubmitting}
        />

        <span
          className="custom-checkbox"
          aria-hidden="true"
        >
          ✓
        </span>

        <span>Keep me logged in</span>
      </label>

      <button
        type="submit"
        className="auth-submit-button"
        disabled={isSubmitting}
      >
        <span>
          {isSubmitting
            ? "Signing you in..."
            : "Enter my health space"}
        </span>

        {!isSubmitting && <ArrowIcon />}
      </button>

      <div className="auth-divider">
        <span>New here?</span>
      </div>

      <div className="auth-footer-text">
        <span>
          Create your family health account.
        </span>

        <Link to="/register">
          Join now →
        </Link>
      </div>

      <Link
        to="/"
        className="back-home-link"
      >
        ← Back to homepage
      </Link>
    </form>
  );
}

export default LoginForm;