const mongoose = require("mongoose");

const anomalyEventSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: [true, "Family member is required"],
      index: true,
    },

    vitalType: {
      type: String,
      enum: [
        "heartRate",
        "spo2",
        "bodyTemperature",
        "activityMinutes",
        "sleepHours",
        "environmentalTemperature",
        "humidity",
        "aqi",
      ],
      required: [true, "Vital type is required"],
    },

    currentValue: {
      type: Number,
      required: [true, "Current value is required"],
    },

    baselineAverage: {
      type: Number,
      default: null,
    },

    baselineStandardDeviation: {
      type: Number,
      default: null,
    },

    deviationScore: {
      type: Number,
      default: null,
    },

    severity: {
      type: String,
      enum: ["normal", "warning", "critical"],
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

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

    detectedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

anomalyEventSchema.index({
  memberId: 1,
  detectedAt: -1,
});

module.exports = mongoose.model(
  "AnomalyEvent",
  anomalyEventSchema
);