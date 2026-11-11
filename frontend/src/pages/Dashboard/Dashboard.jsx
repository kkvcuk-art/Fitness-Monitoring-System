import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router";

import DashboardLayout from "../../layouts/DashboardLayout";

import StatisticsCards from "../../components/dashboard/StatisticsCards";
import FamilyOverview from "../../components/dashboard/FamilyOverview";
import RecentRecords from "../../components/dashboard/RecentRecords";
import QuickActions from "../../components/dashboard/QuickActions";
import FamilyTree from "../../components/dashboard/FamilyTree";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  getDashboardData,
} from "../../services/apiService";

import "./Dashboard.css";

const initialDashboardData = {
  members: [],
  reports: [],
  vaccinations: [],
  upcomingVaccinations: [],

  statistics: {
    members: 0,
    reports: 0,
    vaccinations: 0,
    upcoming: 0,
  },
};

function Dashboard() {
  const navigate = useNavigate();

  const {
    token,
    signOut,
  } = useAuth();

  const [
    dashboardData,
    setDashboardData,
  ] = useState(
    initialDashboardData,
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    let componentIsActive = true;

    async function loadDashboard() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const result =
          await getDashboardData(
            token,
          );

        if (!componentIsActive) {
          return;
        }

        setDashboardData(result);
      } catch (error) {
        if (!componentIsActive) {
          return;
        }

        if (error.status === 401) {
          signOut();

          navigate("/login", {
            replace: true,

            state: {
              sessionMessage:
                error.message,
            },
          });

          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load dashboard data.",
        );
      } finally {
        if (componentIsActive) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      componentIsActive = false;
    };
  }, [
    token,
    signOut,
    navigate,
  ]);

  return (
    <DashboardLayout>
      {/* Welcome */}

      <section className="dashboard-welcome-panel">
        <span className="dashboard-page-label">
          FAMILY HEALTH OVERVIEW
        </span>

        <h2>
          Your family&apos;s health,
          organized in one place.
        </h2>

        <p>
          Review family members, medical
          information and vaccination records
          from your dashboard.
        </p>
      </section>

      {/* Backend error */}

      {errorMessage && (
        <div
          className="dashboard-error-message"
          role="alert"
        >
          <div>
            <strong>
              Dashboard data could not be
              loaded
            </strong>

            <p>{errorMessage}</p>
          </div>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
          >
            Try again
          </button>
        </div>
      )}

      {/* Statistics */}

      <StatisticsCards
        values={
          dashboardData.statistics
        }
        loading={isLoading}
      />

      {/* Role-based actions */}

      <QuickActions />

      {/* Family tree */}

      <FamilyTree
        members={
          dashboardData.members
        }
      />

      {/* Family and medical information */}

      <div className="dashboard-details-grid">
        <FamilyOverview
          members={
            dashboardData.members
          }
          loading={isLoading}
        />

        <RecentRecords
          reports={
            dashboardData.reports
          }
          loading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;