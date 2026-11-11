import {
  useState,
} from "react";

import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import EmergencySOSModal from "../components/dashboard/EmergencySOSModal";

function DashboardLayout({
  children,
}) {
  const [
    isSidebarOpen,
    setIsSidebarOpen,
  ] = useState(false);

  const [
    isSosOpen,
    setIsSosOpen,
  ] = useState(false);

  function openSidebar() {
    setIsSidebarOpen(true);
  }

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <div className="dashboard-layout">
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <div className="dashboard-main-area">
        <DashboardHeader
          onOpenSidebar={openSidebar}
          onOpenSos={() => setIsSosOpen(true)}
        />

        <main className="dashboard-content">
          {children}
        </main>

        <EmergencySOSModal
          isOpen={isSosOpen}
          onClose={() => setIsSosOpen(false)}
        />
      </div>
    </div>
  );
}

export default DashboardLayout;