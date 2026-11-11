const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// In-memory array store with initial sample reminders if database model isn't active
let remindersStore = [
  {
    id: "rem-1",
    title: "Morning Blood Pressure Medication (Amlodipine 5mg)",
    type: "Medication",
    frequency: "Daily",
    time: "08:00 AM",
    completedToday: false,
    notes: "Take after breakfast with water",
  },
  {
    id: "rem-2",
    title: "Annual Cardiovascular & Lipid Profile Checkup",
    type: "Checkup",
    frequency: "Annual",
    time: "09:30 AM",
    date: "2026-10-15",
    completedToday: false,
    notes: "Fasting required 12 hours prior",
  },
  {
    id: "rem-3",
    title: "Daily Physical Activity Goal (30 Mins Walk)",
    type: "Activity",
    frequency: "Daily",
    time: "06:00 PM",
    completedToday: true,
    notes: "Target: 6,000 steps minimum",
  },
  {
    id: "rem-4",
    title: "Daily Hydration Reminder (2.5L Water Intake)",
    type: "Water",
    frequency: "Daily",
    time: "Every 2 Hours",
    completedToday: false,
    notes: "Stay hydrated throughout the day",
  },
];

// GET /api/reminders
router.get("/", protect, (req, res) => {
  return res.status(200).json({
    success: true,
    data: remindersStore,
  });
});

// POST /api/reminders
router.post("/", protect, (req, res) => {
  const { title, type, frequency, time, notes } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, message: "Title is required" });
  }

  const newReminder = {
    id: `rem-${Date.now()}`,
    title,
    type: type || "Medication",
    frequency: frequency || "Daily",
    time: time || "09:00 AM",
    completedToday: false,
    notes: notes || "",
  };

  remindersStore.unshift(newReminder);

  return res.status(201).json({
    success: true,
    data: newReminder,
  });
});

// PATCH /api/reminders/:id/toggle
router.patch("/:id/toggle", protect, (req, res) => {
  const reminder = remindersStore.find((r) => r.id === req.params.id);
  if (!reminder) {
    return res.status(404).json({ success: false, message: "Reminder not found" });
  }

  reminder.completedToday = !reminder.completedToday;

  return res.status(200).json({
    success: true,
    data: reminder,
  });
});

// DELETE /api/reminders/:id
router.delete("/:id", protect, (req, res) => {
  remindersStore = remindersStore.filter((r) => r.id !== req.params.id);
  return res.status(200).json({
    success: true,
    message: "Reminder deleted successfully",
  });
});

module.exports = router;
