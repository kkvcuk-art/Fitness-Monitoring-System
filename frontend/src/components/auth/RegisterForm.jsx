import { useState } from "react";
import { Link, useNavigate } from "react-router";

import PasswordInput from "./PasswordInput";
import { registerUser } from "../../services/authService";

function FieldIcon({ type }) {
  const paths = {
    name: (
      <>
        <circle
          cx="12"
          cy="8"
          r="4"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M4 21C4 17.1 7.6 14 12 14C16.4 14 20 17.1 20 21"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </>
    ),

    email: (
      <>
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
        />
      </>
    ),

    phone: (
      <path
        d="M7 3H5C3.9 3 3 3.9 3 5C3 13.8 10.2 21 19 21C20.1 21 21 20.1 21 19V17L16.8 15.6L15.8 18C11.3 16.1 7.9 12.7 6 8.2L8.4 7.2L7 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),

    date: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M8 3V7M16 3V7M3 10H21"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" fill="none">
      {paths[type]}
    </svg>
  );
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) {
    return null;
  }

  const today = new Date();
  const birthDate =
    new Date(`${dateOfBirth}T00:00:00`);

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const monthDifference =
    today.getMonth() -
    birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (
      monthDifference === 0 &&
      today.getDate() < birthDate.getDate()
    )
  ) {
    age -= 1;
  }

  return age;
}

function RegisterForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });

  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const currentAge =
    calculateAge(formData.dateOfBirth);

  const today =
    new Date().toISOString().split("T")[0];

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

    if (message) {
      setMessage("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setMessage("");

    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.dateOfBirth ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setMessage(
        "Please complete all required fields.",
      );
      return;
    }

    if (
      currentAge === null ||
      currentAge < 0
    ) {
      setMessage(
        "Please enter a valid date of birth.",
      );
      return;
    }

    if (formData.password.length < 6) {
      setMessage(
        "Password must contain at least 6 characters.",
      );
      return;
    }

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      setMessage(
        "Password and confirm password do not match.",
      );
      return;
    }

    if (!formData.acceptedTerms) {
      setMessage(
        "Please accept the Terms and Privacy Policy.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registerUser({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        password: formData.password,
      });

      navigate("/login", {
        replace: true,

        state: {
          registrationSuccess: true,
          message: result.message,
          email: result.user.email,
          role: result.user.role,
          age: result.user.age,
        },
      });
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="register-form"
      onSubmit={handleSubmit}
      noValidate
    >
      {message && (
        <div
          className="auth-message"
          role="alert"
          aria-live="polite"
        >
          {message}
        </div>
      )}

      <div className="register-fields-grid">
        <div className="form-group full-width-field">
          <label htmlFor="fullName">
            Full name
          </label>

          <div className="input-container">
            <span
              className="input-icon"
              aria-hidden="true"
            >
              <FieldIcon type="name" />
            </span>

            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              autoComplete="name"
              disabled={isSubmitting}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="registerEmail">
            Email address
          </label>

          <div className="input-container">
            <span
              className="input-icon"
              aria-hidden="true"
            >
              <FieldIcon type="email" />
            </span>

            <input
              type="email"
              id="registerEmail"
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
          <label htmlFor="phone">
            Phone number
            <span className="optional-label">
              Optional
            </span>
          </label>

          <div className="input-container">
            <span
              className="input-icon"
              aria-hidden="true"
            >
              <FieldIcon type="phone" />
            </span>

            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="9876543210"
              autoComplete="tel"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="form-group full-width-field">
          <label htmlFor="dateOfBirth">
            Date of birth
          </label>

          <div className="input-container">
            <span
              className="input-icon"
              aria-hidden="true"
            >
              <FieldIcon type="date" />
            </span>

            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              max={today}
              autoComplete="bday"
              disabled={isSubmitting}
              required
            />
          </div>

          {currentAge !== null &&
            currentAge >= 0 && (
              <div
                className={`role-preview ${
                  currentAge > 21
                    ? "manager-role"
                    : "viewer-role"
                }`}
              >
                <span aria-hidden="true">
                  {currentAge > 21 ? "✓" : "◉"}
                </span>

                <span>
                  Age {currentAge}:{" "}
                  {currentAge > 21
                    ? "Health manager access"
                    : "View-only access"}
                </span>
              </div>
            )}
        </div>

        <div className="form-group">
          <label htmlFor="registerPassword">
            Password
          </label>

          <PasswordInput
            id="registerPassword"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Minimum 6 characters"
            autoComplete="new-password"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">
            Confirm password
          </label>

          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Enter password again"
            autoComplete="new-password"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <label className="checkbox-label register-terms">
        <input
          type="checkbox"
          name="acceptedTerms"
          checked={formData.acceptedTerms}
          onChange={handleChange}
          disabled={isSubmitting}
        />

        <span
          className="custom-checkbox"
          aria-hidden="true"
        >
          ✓
        </span>

        <span>
          I agree to the{" "}
          <Link to="/terms">Terms</Link> and{" "}
          <Link to="/privacy">Privacy Policy</Link>.
        </span>
      </label>

      <button
        type="submit"
        className="auth-submit-button"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? "Creating your account..."
          : "Create my health account"}
      </button>

      <div className="auth-divider">
        <span>Already registered?</span>
      </div>

      <div className="auth-footer-text">
        <span>Welcome back.</span>
        <Link to="/login">Login now →</Link>
      </div>

      <Link to="/" className="back-home-link">
        ← Back to homepage
      </Link>
    </form>
  );
}

export default RegisterForm;