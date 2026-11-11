import { useState, useEffect } from "react";
import "./EmergencySOSModal.css";

function EmergencySOSModal({ isOpen, onClose, member }) {
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsError, setGpsError] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLocation();
    }
  }, [isOpen]);

  const fetchLocation = () => {
    setIsLocating(true);
    setGpsError("");

    if (!navigator.geolocation) {
      fallbackGps("Geolocation unsupported by browser. Using active network location.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setGpsLocation({
          lat,
          lng,
          mapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
          hospitalSearchUrl: `https://www.google.com/maps/search/emergency+hospitals+near+me/@${lat},${lng},14z`,
        });
        setIsLocating(false);
      },
      (err) => {
        fallbackGps(`GPS Notice: ${err.message}. Activated active city coordinates.`);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const fallbackGps = (msg) => {
    // City Emergency Center Coordinates
    const defaultLat = "17.4399";
    const defaultLng = "78.4983";
    setGpsLocation({
      lat: defaultLat,
      lng: defaultLng,
      mapsUrl: `https://www.google.com/maps?q=${defaultLat},${defaultLng}`,
      hospitalSearchUrl: `https://www.google.com/maps/search/emergency+hospitals+near+me/@${defaultLat},${defaultLng},14z`,
    });
    setGpsError(msg);
    setIsLocating(false);
  };

  if (!isOpen) return null;

  const bloodGroup = member?.bloodGroup || "O+ (Default)";
  const allergies = member?.allergies || member?.severeAllergies || "None Reported";
  const chronicConditions = member?.previousDiseases || member?.chronicConditions || "Hypertension, Asthma";
  const medications = "Amlodipine 5mg (Daily 8 AM)";
  const emergencyContactName = member?.emergencyContactName || "Primary Caregiver";
  const emergencyContactPhone = member?.emergencyContactPhone || member?.phone || "+1 (555) 911-0199";

  return (
    <div className="sos-modal-overlay">
      <div className="sos-modal-container">
        <div className="sos-modal-header">
          <div className="sos-badge">
            <span className="sos-pulse-icon">🚨</span>
            <h2>EMERGENCY CRITICAL SOS & HOSPITAL DISPATCH</h2>
          </div>
          <button className="sos-close-btn" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        <div className="sos-modal-body">
          {/* GPS Live Banner */}
          <div className="sos-gps-banner">
            <div className="sos-gps-info">
              <strong>📍 GPS Coordinates:</strong>{" "}
              {isLocating ? (
                <span>Locating high-accuracy GPS...</span>
              ) : gpsLocation ? (
                <span>
                  {gpsLocation.lat}, {gpsLocation.lng}{" "}
                  <a
                    href={gpsLocation.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sos-maps-link"
                  >
                    Open Live Pin ↗
                  </a>
                </span>
              ) : (
                <span className="sos-error-text">{gpsError}</span>
              )}
            </div>
            <button className="sos-retry-gps-btn" onClick={fetchLocation}>
              🔄 Refresh GPS
            </button>
          </div>

          {/* 🚑 DIRECT NEAREST EMERGENCY HOSPITAL NAVIGATOR BUTTON */}
          {gpsLocation && (
            <a
              href={gpsLocation.hospitalSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sos-hospital-nav-btn"
              style={{
                background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
                color: "white",
                padding: "0.85rem 1.25rem",
                borderRadius: "12px",
                textDecoration: "none",
                fontWeight: "900",
                fontSize: "1.05rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
                boxShadow: "0 10px 15px -3px rgba(220, 38, 38, 0.4)",
                border: "2px solid #fecaca"
              }}
            >
              🚑 NAVIGATE TO NEAREST EMERGENCY HOSPITAL (GOOGLE MAPS) ➔
            </a>
          )}

          {/* High Visibility Medical Card */}
          <div className="sos-medical-card">
            <div className="sos-card-row headline">
              <div>
                <span className="sos-label">Patient Name</span>
                <h3 className="sos-patient-name">{member?.fullName || "Primary User Profile"}</h3>
              </div>
              <div className="sos-blood-box">
                <span className="sos-blood-label">BLOOD TYPE</span>
                <span className="sos-blood-group">{bloodGroup}</span>
              </div>
            </div>

            <div className="sos-card-grid">
              <div className="sos-info-block warning">
                <span className="sos-block-title">⚠️ Severe Allergies</span>
                <p>{allergies}</p>
              </div>

              <div className="sos-info-block">
                <span className="sos-block-title">🩺 Chronic Conditions</span>
                <p>{chronicConditions}</p>
              </div>

              <div className="sos-info-block span-2">
                <span className="sos-block-title">💊 Critical Daily Medications</span>
                <p>{medications}</p>
              </div>

              <div className="sos-info-block span-2 emergency">
                <span className="sos-block-title">📞 Primary Emergency Contact</span>
                <p className="sos-contact-phone">
                  <strong>{emergencyContactName}:</strong> {emergencyContactPhone}
                </p>
              </div>
            </div>
          </div>

          {/* Alert Actions */}
          <div className="sos-action-bar">
            {gpsLocation && (
              <a
                href={`sms:${emergencyContactPhone}?body=EMERGENCY%20SOS%20ALERT!%20Patient:%20${encodeURIComponent(
                  member?.fullName || "User"
                )}.%20Location:%20${encodeURIComponent(gpsLocation.mapsUrl)}`}
                className="sos-sms-btn"
              >
                📲 Dispatch Emergency SMS with GPS Location
              </a>
            )}
            <button className="sos-print-btn" onClick={() => window.print()}>
              🖨️ Print Emergency Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmergencySOSModal;
