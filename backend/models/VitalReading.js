const mongoose = require("mongoose");

/* =========================================================
   VITAL READING SCHEMA

   Stores one health-monitoring reading for a family member.
   These readings will later be used for:
   - Personal baseline calculation
   - Anomaly detection
   - AI risk analysis
   - Health trends
   ========================================================= */

const vitalReadingSchema = new mongoose.Schema(
  {
    /* =====================================================
       FAMILY MEMBER
       ===================================================== */

    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: [
        true,
        "Family member is required",
      ],
      index: true,
    },

    /* =====================================================
       SOURCE

       Currently:
       - demo = simulated readings

       Later:
       - phone
       - smartwatch
       - fitness_band
       - medical_wearable
       ===================================================== */

    source: {
      type: String,
      enum: [
        "demo",
        "phone",
        "smartwatch",
        "fitness_band",
        "medical_wearable",
      ],
      default: "demo",
    },

    /* =====================================================
       PHYSIOLOGICAL VITALS
       ===================================================== */

    heartRate: {
      type: Number,
      min: 20,
      max: 250,
    },

    spo2: {
      type: Number,
      min: 50,
      max: 100,
    },

    bodyTemperature: {
      type: Number,
      min: 25,
      max: 45,
    },

    /* =====================================================
       ACTIVITY & SLEEP
       ===================================================== */

    activityMinutes: {
      type: Number,
      min: 0,
      max: 1440,
      default: 0,
    },

    sleepHours: {
      type: Number,
      min: 0,
      max: 24,
    },

    /* =====================================================
       OPTIONAL ENVIRONMENTAL DATA

       We are adding these now so the same reading can
       later combine personal health + environment data.
       ===================================================== */

    environmentalTemperature: {
      type: Number,
    },

    humidity: {
      type: Number,
      min: 0,
      max: 100,
    },

    aqi: {
      type: Number,
      min: 0,
    },

    /* =====================================================
       DEVICE STATUS
       ===================================================== */

    isSimulated: {
      type: Boolean,
      default: true,
    },

    /* =====================================================
       READING TIMESTAMP

       This is different from createdAt.

       recordedAt = when the measurement happened
       createdAt  = when MongoDB stored the document
       ===================================================== */

    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },

  {
    timestamps: true,
  },
);

/* =========================================================
   INDEX

   Makes it faster to retrieve recent readings for
   a particular family member.
   ========================================================= */

vitalReadingSchema.index({
  memberId: 1,
  recordedAt: -1,
});

module.exports = mongoose.model(
  "VitalReading",
  vitalReadingSchema,
);