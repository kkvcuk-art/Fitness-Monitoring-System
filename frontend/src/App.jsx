import {
  Route,
  Routes,
} from "react-router";

import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Dashboard from "./pages/Dashboard/Dashboard";

import Members from "./pages/Members/Members";
import AddMember from "./pages/Members/AddMember";
import MemberDetails from "./pages/Members/MemberDetails";
import EditMember from "./pages/Members/EditMember";

import MedicalReports from "./pages/MedicalReports/MedicalReports";
import AddMedicalReport from "./pages/MedicalReports/AddMedicalReport";
import MedicalReportDetails from "./pages/MedicalReports/MedicalReportDetails";
import EditMedicalReport from "./pages/MedicalReports/EditMedicalReport";

import Vaccinations from "./pages/Vaccinations/Vaccinations";
import AddVaccination from "./pages/Vaccinations/AddVaccination";
import VaccinationDetails from "./pages/Vaccinations/VaccinationDetails";
import EditVaccination from "./pages/Vaccinations/EditVaccination";

import HealthHistory from "./pages/HealthHistory/HealthHistory";
import AddHealthHistory from "./pages/HealthHistory/AddHealthHistory";
import HealthHistoryDetails from "./pages/HealthHistory/HealthHistoryDetails";
import EditHealthHistory from "./pages/HealthHistory/EditHealthHistory";

import HealthMonitor from "./pages/HealthMonitor/HealthMonitor";

import Relationships from "./pages/Relationships/Relationships";
import AddRelationship from "./pages/Relationships/AddRelationship";

import RiskPrediction from "./pages/RiskPrediction/RiskPrediction";
import DigitalTwin from "./pages/DigitalTwin/DigitalTwin";
import SmartReminders from "./pages/SmartReminders/SmartReminders";
import DoctorRecommendations from "./pages/DoctorRecommendations/DoctorRecommendations";
import DisasterAlerts from "./pages/DisasterAlerts/DisasterAlerts";
import CaregiverCenter from "./pages/CaregiverCenter";
import ProviderHealth from "./pages/ProviderHealth/ProviderHealth";

import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/risk-prediction"
        element={
          <ProtectedRoute>
            <RiskPrediction />
          </ProtectedRoute>
        }
      />

      <Route
        path="/digital-twin"
        element={
          <ProtectedRoute>
            <DigitalTwin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reminders"
        element={
          <ProtectedRoute>
            <SmartReminders />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor-recommendations"
        element={
          <ProtectedRoute>
            <DoctorRecommendations />
          </ProtectedRoute>
        }
      />

      <Route
        path="/caregiver-center"
        element={
          <ProtectedRoute>
            <CaregiverCenter />
          </ProtectedRoute>
        }
      />

      <Route
        path="/provider-health"
        element={
          <ProtectedRoute>
            <ProviderHealth />
          </ProtectedRoute>
        }
      />

      <Route
        path="/disaster-alerts"
        element={
          <ProtectedRoute>
            <DisasterAlerts />
          </ProtectedRoute>
        }
      />

      <Route
        path="/members"
        element={
          <ProtectedRoute>
            <Members />
          </ProtectedRoute>
        }
      />

      <Route
        path="/members/add"
        element={
          <ProtectedRoute>
            <AddMember />
          </ProtectedRoute>
        }
      />

      <Route
        path="/members/:memberId/edit"
        element={
          <ProtectedRoute>
            <EditMember />
          </ProtectedRoute>
        }
      />

      <Route
        path="/members/:memberId"
        element={
          <ProtectedRoute>
            <MemberDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/medical-reports"
        element={
          <ProtectedRoute>
            <MedicalReports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/medical-reports/add"
        element={
          <ProtectedRoute>
            <AddMedicalReport />
          </ProtectedRoute>
        }
      />

      <Route
        path="/medical-reports/:reportId/edit"
        element={
          <ProtectedRoute>
            <EditMedicalReport />
          </ProtectedRoute>
        }
      />

      <Route
        path="/medical-reports/:reportId"
        element={
          <ProtectedRoute>
            <MedicalReportDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vaccinations"
        element={
          <ProtectedRoute>
            <Vaccinations />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vaccinations/add"
        element={
          <ProtectedRoute>
            <AddVaccination />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vaccinations/:vaccinationId/edit"
        element={
          <ProtectedRoute>
            <EditVaccination />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vaccinations/:vaccinationId"
        element={
          <ProtectedRoute>
            <VaccinationDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/health-history"
        element={
          <ProtectedRoute>
            <HealthHistory />
          </ProtectedRoute>
        }
      />

      <Route
        path="/health-history/add"
        element={
          <ProtectedRoute>
            <AddHealthHistory />
          </ProtectedRoute>
        }
      />

      <Route
        path="/health-history/:historyId/edit"
        element={
          <ProtectedRoute>
            <EditHealthHistory />
          </ProtectedRoute>
        }
      />

      <Route
        path="/health-history/:historyId"
        element={
          <ProtectedRoute>
            <HealthHistoryDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/health-monitor"
        element={
        <ProtectedRoute>
        <HealthMonitor />
        </ProtectedRoute>
        }
      />

      <Route
        path="/relationships"
        element={
          <ProtectedRoute>
            <Relationships />
          </ProtectedRoute>
        }
      />

      <Route
        path="/relationships/add"
        element={
          <ProtectedRoute>
            <AddRelationship />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;