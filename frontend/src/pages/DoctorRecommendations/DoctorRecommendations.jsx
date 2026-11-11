import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import "./DoctorRecommendations.css";

function DoctorRecommendations() {
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");

  const hospitalList = [
    {
      id: "hosp-1",
      name: "City Care Super Specialty Hospital",
      specialties: ["Cardiologist", "Nephrologist", "Endocrinologist"],
      rating: "4.8 ★",
      address: "102 Health Avenue, Medical District",
      distance: "2.4 km away",
      phone: "+1 (555) 234-5678",
      lat: 17.4399,
      lng: 78.4983,
    },
    {
      id: "hosp-2",
      name: "St. Jude Kidney & Metabolism Institute",
      specialties: ["Nephrologist", "General Physician"],
      rating: "4.9 ★",
      address: "45 Nephro Boulevard, Central Square",
      distance: "4.1 km away",
      phone: "+1 (555) 876-5432",
      lat: 17.4455,
      lng: 78.5022,
    },
    {
      id: "hosp-3",
      name: "Apollo Heart & Vascular Research Center",
      specialties: ["Cardiologist"],
      rating: "4.7 ★",
      address: "88 Cardiac Parkway, East Side",
      distance: "5.8 km away",
      phone: "+1 (555) 990-1122",
      lat: 17.4211,
      lng: 78.4891,
    },
    {
      id: "hosp-4",
      name: "Metabolic & Endocrine Wellness Clinic",
      specialties: ["Endocrinologist", "General Physician"],
      rating: "4.6 ★",
      address: "12 Diabetes Lane, West Park",
      distance: "3.2 km away",
      phone: "+1 (555) 334-9988",
      lat: 17.4512,
      lng: 78.5110,
    },
  ];

  const filteredHospitals =
    selectedSpecialty === "All"
      ? hospitalList
      : hospitalList.filter((h) => h.specialties.includes(selectedSpecialty));

  return (
    <DashboardLayout>
      <div className="doctor-container">
        <header className="doctor-header">
          <span className="badge">MODULE 4: AI DOCTOR & HOSPITAL RECOMMENDATIONS</span>
          <h2>Specialist Match & Local Healthcare Navigation</h2>
          <p>
            Map AI-predicted risk profiles directly to clinical specialties, list verified local hospitals, 
            and access routing coordinates powered by Google Maps.
          </p>
        </header>

        {/* Risk-to-Specialty Mapping Cards */}
        <section className="specialty-mapping-section">
          <h3>🩺 AI Risk-to-Specialty Category Mapping</h3>
          <div className="mapping-cards-grid">
            <div
              className={`mapping-card ${selectedSpecialty === "Nephrologist" ? "active" : ""}`}
              onClick={() => setSelectedSpecialty("Nephrologist")}
            >
              <div className="card-top">
                <span className="spec-icon">🧪</span>
                <span className="risk-indicator high">Elevated Kidney Risk</span>
              </div>
              <h4>Nephrologist</h4>
              <p>Specializes in renal function, glomerular filtration, and electrolyte balance.</p>
            </div>

            <div
              className={`mapping-card ${selectedSpecialty === "Cardiologist" ? "active" : ""}`}
              onClick={() => setSelectedSpecialty("Cardiologist")}
            >
              <div className="card-top">
                <span className="spec-icon">🫀</span>
                <span className="risk-indicator high">Elevated Cardio Risk</span>
              </div>
              <h4>Cardiologist</h4>
              <p>Specializes in vascular hypertension, arterial disease, and coronary care.</p>
            </div>

            <div
              className={`mapping-card ${selectedSpecialty === "Endocrinologist" ? "active" : ""}`}
              onClick={() => setSelectedSpecialty("Endocrinologist")}
            >
              <div className="card-top">
                <span className="spec-icon">🩸</span>
                <span className="risk-indicator moderate">Elevated Diabetes Risk</span>
              </div>
              <h4>Endocrinologist</h4>
              <p>Specializes in glucose homeostasis, insulin sensitivity, and metabolic health.</p>
            </div>

            <div
              className={`mapping-card ${selectedSpecialty === "All" ? "active" : ""}`}
              onClick={() => setSelectedSpecialty("All")}
            >
              <div className="card-top">
                <span className="spec-icon">🏥</span>
                <span className="risk-indicator low">All Specialties</span>
              </div>
              <h4>All Nearby Centers</h4>
              <p>Show all verified primary and super-specialty hospitals in your radius.</p>
            </div>
          </div>
        </section>

        {/* Hospital Directory & Google Maps Integration */}
        <section className="hospitals-section">
          <div className="section-title-row">
            <h3>📍 Nearby Hospitals & Clinical Centers ({filteredHospitals.length})</h3>
            <span className="active-filter">Filter: {selectedSpecialty}</span>
          </div>

          <div className="hospitals-grid">
            {filteredHospitals.map((hospital) => (
              <div key={hospital.id} className="hospital-card">
                <div className="hosp-header">
                  <h4>{hospital.name}</h4>
                  <span className="rating-tag">{hospital.rating}</span>
                </div>

                <p className="address-text">📍 {hospital.address} ({hospital.distance})</p>
                <p className="phone-text">📞 {hospital.phone}</p>

                <div className="tags-row">
                  {hospital.specialties.map((spec, i) => (
                    <span key={i} className="spec-tag">
                      {spec}
                    </span>
                  ))}
                </div>

                <div className="hosp-actions">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      hospital.name + " " + hospital.address
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="maps-route-btn"
                  >
                    🗺️ Navigate on Google Maps
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default DoctorRecommendations;
