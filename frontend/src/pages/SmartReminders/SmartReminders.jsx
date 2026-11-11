import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import {
  getSmartReminders,
  createSmartReminder,
  toggleSmartReminder,
  deleteSmartReminder,
} from "../../services/apiService";
import "./SmartReminders.css";

function SmartReminders() {
  const { token } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newReminder, setNewReminder] = useState({
    title: "",
    type: "Medication",
    frequency: "Daily",
    time: "09:00 AM",
    notes: "",
  });

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const res = await getSmartReminders(token);
      if (res.success) {
        setReminders(res.data);
      }
    } catch {
      // SILENT FALLBACK
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    setReminders(
      reminders.map((r) =>
        r.id === id ? { ...r, completedToday: !r.completedToday } : r
      )
    );
    try {
      await toggleSmartReminder(token, id);
    } catch {
      loadReminders();
    }
  };

  const handleDelete = async (id) => {
    setReminders(reminders.filter((r) => r.id !== id));
    try {
      await deleteSmartReminder(token, id);
    } catch {
      loadReminders();
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await createSmartReminder(token, newReminder);
      if (res.success) {
        setReminders([res.data, ...reminders]);
        setNewReminder({
          title: "",
          type: "Medication",
          frequency: "Daily",
          time: "09:00 AM",
          notes: "",
        });
        setShowAddForm(false);
      }
    } catch {
      // SILENT FALLBACK
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case "Medication": return "type-med";
      case "Checkup": return "type-checkup";
      case "Activity": return "type-activity";
      case "Water": return "type-water";
      default: return "type-default";
    }
  };

  return (
    <DashboardLayout>
      <div className="reminders-container">
        <header className="reminders-header">
          <div>
            <span className="badge">MODULE 5: SMART HEALTH REMINDER</span>
            <h2>Smart Compliance Alerts & Habit Tracking</h2>
            <p>
              Program daily medication dosages, annual checkup prompts, follow-up lab test alerts, 
              and daily hydration / activity goals.
            </p>
          </div>
          <button
            className="add-reminder-btn"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? "✕ Cancel" : "➕ Program New Alert"}
          </button>
        </header>

        {showAddForm && (
          <form className="add-reminder-card" onSubmit={handleCreate}>
            <h3>Program New Health Alert</h3>
            <div className="form-grid">
              <div className="field-group span-2">
                <label>Reminder Title / Dosage</label>
                <input
                  type="text"
                  placeholder="e.g. Amlodipine 5mg or Annual Kidney Checkup"
                  value={newReminder.title}
                  onChange={(e) =>
                    setNewReminder({ ...newReminder, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="field-group">
                <label>Category Type</label>
                <select
                  value={newReminder.type}
                  onChange={(e) =>
                    setNewReminder({ ...newReminder, type: e.target.value })
                  }
                >
                  <option value="Medication">💊 Medication</option>
                  <option value="Checkup">🩺 Clinical Checkup</option>
                  <option value="Activity">🏃 Physical Activity</option>
                  <option value="Water">💧 Water Intake</option>
                </select>
              </div>

              <div className="field-group">
                <label>Frequency</label>
                <select
                  value={newReminder.frequency}
                  onChange={(e) =>
                    setNewReminder({ ...newReminder, frequency: e.target.value })
                  }
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>

              <div className="field-group">
                <label>Target Time / Schedule</label>
                <input
                  type="text"
                  placeholder="e.g. 08:00 AM"
                  value={newReminder.time}
                  onChange={(e) =>
                    setNewReminder({ ...newReminder, time: e.target.value })
                  }
                />
              </div>

              <div className="field-group">
                <label>Special Instructions / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Take after meals"
                  value={newReminder.notes}
                  onChange={(e) =>
                    setNewReminder({ ...newReminder, notes: e.target.value })
                  }
                />
              </div>
            </div>
            <button type="submit" className="save-btn">
              💾 Save Alert & Schedule Push Prompts
            </button>
          </form>
        )}

        <div className="reminders-list-grid">
          {loading ? (
            <div className="loading">Loading health alerts...</div>
          ) : reminders.length === 0 ? (
            <div className="empty">No reminders scheduled yet. Click "Program New Alert" above.</div>
          ) : (
            reminders.map((r) => (
              <div
                key={r.id}
                className={`reminder-card ${r.completedToday ? "completed" : ""}`}
              >
                <div className="reminder-header-row">
                  <span className={`type-badge ${getTypeBadgeClass(r.type)}`}>
                    {r.type}
                  </span>
                  <span className="freq-tag">{r.frequency} • {r.time}</span>
                </div>

                <h4 className="reminder-title">{r.title}</h4>
                {r.notes && <p className="reminder-notes">📝 {r.notes}</p>}

                <div className="reminder-actions">
                  <button
                    className={`toggle-check-btn ${r.completedToday ? "done" : ""}`}
                    onClick={() => handleToggle(r.id)}
                  >
                    {r.completedToday ? "✅ Completed Today" : "⭕ Mark Completed"}
                  </button>
                  <button className="del-btn" onClick={() => handleDelete(r.id)}>
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default SmartReminders;
