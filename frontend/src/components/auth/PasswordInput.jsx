import { useState } from "react";

function EyeIcon({ visible }) {
  if (visible) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 3L21 21"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <path
          d="M10.6 10.7C10.2 11.1 10 11.5 10 12C10 13.1 10.9 14 12 14C12.5 14 12.9 13.8 13.3 13.4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <path
          d="M9.4 5.3C10.2 5.1 11.1 5 12 5C17 5 20.3 9.1 21 12C20.7 13.3 19.8 14.9 18.5 16.2M6.2 6.2C4.5 7.5 3.4 9.6 3 12C3.7 14.9 7 19 12 19C13.4 19 14.6 18.7 15.7 18.2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 12C3.7 9.1 7 5 12 5C17 5 20.3 9.1 21 12C20.3 14.9 17 19 12 19C7 19 3.7 14.9 3 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PasswordInput({
  id = "password",
  name = "password",
  value,
  onChange,
  placeholder = "Enter your password",
  autoComplete = "current-password",
  disabled = false,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="input-container">
      <span className="input-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <rect
            x="5"
            y="10"
            width="14"
            height="10"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.8"
          />

          <path
            d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>

      <input
        type={visible ? "text" : "password"}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        minLength="6"
        autoComplete={autoComplete}
        disabled={disabled}
        required
      />

      <button
        type="button"
        className="password-toggle"
        onClick={() =>
          setVisible((currentValue) => !currentValue)
        }
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        disabled={disabled}
      >
        <EyeIcon visible={visible} />
      </button>
    </div>
  );
}

export default PasswordInput;