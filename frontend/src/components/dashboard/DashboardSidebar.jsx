import { NavLink } from "react-router";

import Brand from "../common/Brand";

import {
  useAuth,
} from "../../context/AuthContext";

const navigationItems = [
  {
    label: "Dashboard",
    type: "dashboard",
    destination: "/dashboard",
    available: true,
  },

  /* =====================================================
     NEW — HEALTH MONITOR
     ===================================================== */

  {
    label: "Health Monitor",
    type: "health-monitor",
    destination: "/health-monitor",
    available: true,
  },

  {
    label: "AI Risk Prediction",
    type: "ai-risk",
    destination: "/risk-prediction",
    available: true,
  },

  {
    label: "Digital Health Twin",
    type: "digital-twin",
    destination: "/digital-twin",
    available: true,
  },

  {
    label: "Smart Reminders",
    type: "reminders",
    destination: "/reminders",
    available: true,
  },

  {
    label: "Doctor Finder",
    type: "doctors",
    destination: "/doctor-recommendations",
    available: true,
  },

  {
    label: "Disaster Early Warning",
    type: "disaster",
    destination: "/disaster-alerts",
    available: true,
  },

  {
    label: "Caregiver Center",
    type: "caregiver",
    destination: "/caregiver-center",
    available: true,
  },

  {
    label: "Provider & Public Health",
    type: "provider",
    destination: "/provider-health",
    available: true,
  },

  {
    label: "Family Members",
    type: "members",
    destination: "/members",
    available: true,
  },

  {
    label: "Medical Reports",
    type: "reports",
    destination: "/medical-reports",
    available: true,
  },

  {
    label: "Vaccinations",
    type: "vaccination",
    destination: "/vaccinations",
    available: true,
  },

  {
    label: "Health History",
    type: "history",
    destination: "/health-history",
    available: true,
  },
];

/* =========================================================
   SIDEBAR ICONS
   ========================================================= */

function SidebarIcon({ type }) {
  const commonProps = {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  /* -------------------------------------------------------
     DASHBOARD
     ------------------------------------------------------- */

  if (type === "dashboard") {
    return (
      <svg {...commonProps}>
        <rect
          x="3"
          y="3"
          width="7"
          height="7"
          rx="2"
        />

        <rect
          x="14"
          y="3"
          width="7"
          height="7"
          rx="2"
        />

        <rect
          x="3"
          y="14"
          width="7"
          height="7"
          rx="2"
        />

        <rect
          x="14"
          y="14"
          width="7"
          height="7"
          rx="2"
        />
      </svg>
    );
  }

  /* -------------------------------------------------------
     HEALTH MONITOR
     
     Heartbeat / ECG style icon
     ------------------------------------------------------- */

  if (type === "health-monitor") {
    return (
      <svg {...commonProps}>
        <path d="M3 12H7L9.5 5L14 19L17 12H21" />
      </svg>
    );
  }

  if (type === "provider") {
    return (
      <svg {...commonProps}>
        <path d="M4 20V9L12 4L20 9V20" />
        <path d="M8 20V12H16V20" />
        <path d="M12 8V11M10.5 9.5H13.5" />
      </svg>
    );
  }

  /* -------------------------------------------------------
     FAMILY MEMBERS
     ------------------------------------------------------- */

  if (type === "members") {
    return (
      <svg {...commonProps}>
        <circle
          cx="9"
          cy="8"
          r="4"
        />

        <path d="M2.5 21C2.5 17.5 5.4 15 9 15C12.6 15 15.5 17.5 15.5 21" />

        <path d="M16 4.5C18.2 5 19.5 7.2 19 9.3C18.7 10.6 17.8 11.7 16.6 12.2" />

        <path d="M17 15C19.8 15.5 21.5 17.6 21.5 20.5" />
      </svg>
    );
  }

  /* -------------------------------------------------------
     MEDICAL REPORTS
     ------------------------------------------------------- */

  if (type === "reports") {
    return (
      <svg {...commonProps}>
        <path d="M7 3H17L21 7V21H7V3Z" />

        <path d="M17 3V8H21" />

        <path d="M10 12H18M10 16H18" />
      </svg>
    );
  }

  /* -------------------------------------------------------
     VACCINATIONS
     ------------------------------------------------------- */

  if (type === "vaccination") {
    return (
      <svg {...commonProps}>
        <path d="M14.5 4.5L19.5 9.5" />

        <path d="M12.5 6.5L17.5 11.5" />

        <path d="M5 19L15.5 8.5" />

        <path d="M4 15L9 20" />

        <path d="M3 21L6 18" />

        <path d="M17 3L21 7" />
      </svg>
    );
  }

  /* -------------------------------------------------------
     HEALTH HISTORY
     ------------------------------------------------------- */

  if (type === "history") {
    return (
      <svg {...commonProps}>
        <path d="M3 12A9 9 0 1 0 6 5.3" />

        <path d="M3 4V10H9" />

        <path d="M12 7V12L15.5 14" />
      </svg>
    );
  }

  /* -------------------------------------------------------
     DEFAULT ICON
     ------------------------------------------------------- */

  return (
    <svg {...commonProps}>
      <circle
        cx="12"
        cy="12"
        r="8"
      />
    </svg>
  );
}

/* =========================================================
   DASHBOARD SIDEBAR
   ========================================================= */

function DashboardSidebar({
  isOpen,
  onClose,
}) {
  const {
    user,
    canModifyInformation,
  } = useAuth();

  /* -------------------------------------------------------
     USER INITIALS
     ------------------------------------------------------- */

  const nameParts =
    user?.fullName
      ?.trim()
      .split(/\s+/) || [];

  const initials =
    nameParts
      .slice(0, 2)
      .map((part) =>
        part.charAt(0),
      )
      .join("")
      .toUpperCase();

  return (
    <>
      {/* ===================================================
          MOBILE OVERLAY
          =================================================== */}

      <div
        className={`dashboard-overlay ${
          isOpen ? "visible" : ""
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ===================================================
          SIDEBAR
          =================================================== */}

      <aside
        className={`dashboard-sidebar ${
          isOpen ? "open" : ""
        }`}
      >

        {/* =================================================
            BRAND
            ================================================= */}

        <div className="dashboard-sidebar-brand">
          <Brand href="/" />

          <button
            type="button"
            className="sidebar-close-button"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        {/* =================================================
            NAVIGATION
            ================================================= */}

        <nav
          className="dashboard-navigation"
          aria-label="Dashboard navigation"
        >
          <span className="sidebar-section-label">
            MAIN MENU
          </span>

          <div className="sidebar-links">
            {navigationItems.map(
              (item) => {

                /* =========================================
                   DISABLED ITEM
                   ========================================= */

                if (!item.available) {
                  return (
                    <button
                      type="button"
                      className="sidebar-link sidebar-link-disabled"
                      disabled
                      key={item.label}
                      title="This page will be added next"
                    >
                      <span className="sidebar-icon">
                        <SidebarIcon
                          type={
                            item.type
                          }
                        />
                      </span>

                      <span>
                        {item.label}
                      </span>

                      <span className="coming-soon-dot">
                        Soon
                      </span>
                    </button>
                  );
                }

                /* =========================================
                   ACTIVE NAVIGATION ITEM
                   ========================================= */

                return (
                  <NavLink
                    to={
                      item.destination
                    }
                    end
                    className={({
                      isActive,
                    }) =>
                      `sidebar-link ${
                        isActive
                          ? "active"
                          : ""
                      }`
                    }
                    onClick={
                      onClose
                    }
                    key={
                      item.label
                    }
                  >
                    <span className="sidebar-icon">
                      <SidebarIcon
                        type={
                          item.type
                        }
                      />
                    </span>

                    <span>
                      {item.label}
                    </span>
                  </NavLink>
                );
              },
            )}
          </div>
        </nav>

        {/* =================================================
            PERMISSION CARD
            ================================================= */}

        <div className="sidebar-permission-card">
          <span
            className={`permission-indicator ${
              canModifyInformation
                ? "manager"
                : "viewer"
            }`}
          />

          <div>
            <strong>
              {canModifyInformation
                ? "Health Manager"
                : "Viewer"}
            </strong>

            <p>
              {canModifyInformation
                ? "You can manage family information"
                : "You have view-only access"}
            </p>
          </div>
        </div>

        {/* =================================================
            USER CARD
            ================================================= */}

        <div className="sidebar-user-card">
          <span className="sidebar-avatar">
            {initials || "U"}
          </span>

          <div className="sidebar-user-details">
            <strong>
              {user?.fullName ||
                "User"}
            </strong>

            <span>
              {user?.email || ""}
            </span>
          </div>
        </div>

      </aside>
    </>
  );
}

export default DashboardSidebar;