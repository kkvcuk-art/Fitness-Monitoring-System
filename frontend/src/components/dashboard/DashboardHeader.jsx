import { useNavigate } from "react-router";

import {
  useAuth,
} from "../../context/AuthContext";

function MenuIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7H20M4 12H20M4 17H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 4H6C4.9 4 4 4.9 4 6V18C4 19.1 4.9 20 6 20H10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M14 8L18 12L14 16M18 12H9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DashboardHeader({
  onOpenSidebar,
  onOpenSos,
}) {
  const navigate = useNavigate();

  const {
    user,
    canModifyInformation,
    signOut,
  } = useAuth();

  const currentDate =
    new Intl.DateTimeFormat(
      "en-IN",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    ).format(new Date());

  function handleLogout() {
    signOut();

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-left">
        <button
          type="button"
          className="dashboard-menu-button"
          onClick={onOpenSidebar}
          aria-label="Open dashboard menu"
        >
          <MenuIcon />
        </button>

        <div>
          <span className="dashboard-date">
            {currentDate}
          </span>

          <h1>
            Hello,{" "}
            {user?.fullName?.split(" ")[0] ||
              "User"}
            <span aria-hidden="true"> 👋</span>
          </h1>
        </div>
      </div>

      <div className="dashboard-header-actions">
        <button
          type="button"
          className="sos-header-btn"
          onClick={onOpenSos}
          style={{
            background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            color: "white",
            border: "none",
            padding: "0.5rem 0.85rem",
            borderRadius: "8px",
            fontWeight: "800",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            boxShadow: "0 4px 6px -1px rgba(239, 68, 68, 0.4)",
          }}
        >
          🚨 <span>EMERGENCY SOS</span>
        </button>

        <div
          className={`header-role-badge ${
            canModifyInformation
              ? "manager"
              : "viewer"
          }`}
        >
          <span />

          {canModifyInformation
            ? "Health Manager"
            : "View Only"}
        </div>

        <button
          type="button"
          className="header-logout-button"
          onClick={handleLogout}
        >
          <LogoutIcon />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}

export default DashboardHeader;