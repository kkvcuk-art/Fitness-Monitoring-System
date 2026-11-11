import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

const actions = [
  {
    title: "AI Disease Risk Prediction",
    description: "Run ML percentage risk analysis & clinical explanations.",
    icon: "ai",
    route: "/risk-prediction",
  },
  {
    title: "Digital Health Twin Simulator",
    description: "Slide lifestyle factors to test 'What-If' scenarios.",
    icon: "twin",
    route: "/digital-twin",
  },
  {
    title: "Smart Health Reminders",
    description: "Program medication alerts & daily checkup goals.",
    icon: "reminder",
    route: "/reminders",
  },
  {
    title: "AI Doctor & Hospital Finder",
    description: "Find specialists & navigate to local hospitals.",
    icon: "doctor",
    route: "/doctor-recommendations",
  },
];

function QuickActions() {
  const navigate = useNavigate();
  const { canModifyInformation } = useAuth();

  return (
    <section className="quick-actions-section">
      <div className="quick-actions-heading">
        <div>
          <span className="dashboard-section-label">AI PREVENTIVE HEALTH MODULES</span>
          <h2>AI System Tools & Quick Actions</h2>
          <p>
            Explore AI risk prediction, Digital Twin simulations, reminders, and healthcare navigation.
          </p>
        </div>

        <span className={`quick-access-badge ${canModifyInformation ? "allowed" : "restricted"}`}>
          {canModifyInformation ? "Manager access" : "View-only access"}
        </span>
      </div>

      <div className="quick-actions-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {actions.map((action) => (
          <button
            type="button"
            className="quick-action-card"
            onClick={() => navigate(action.route)}
            key={action.title}
            style={{ cursor: "pointer", border: "1px solid #e2e8f0" }}
          >
            <span className="quick-action-icon" style={{ fontSize: "1.4rem" }}>
              {action.icon === "ai" && "🤖"}
              {action.icon === "twin" && "🧪"}
              {action.icon === "reminder" && "⏰"}
              {action.icon === "doctor" && "🩺"}
            </span>

            <span className="quick-action-content">
              <strong>{action.title}</strong>
              <small>{action.description}</small>
            </span>

            <span className="quick-action-arrow" aria-hidden="true">
              →
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default QuickActions;