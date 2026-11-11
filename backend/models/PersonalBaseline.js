const mongoose = require("mongoose");

const personalBaselineSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: [true, "Family member is required"],
      unique: true,
      index: true,
    },

    // Number of readings used to calculate this baseline
    readingCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Heart rate baseline
    heartRate: {
      average: {
        type: Number,
        default: null,
      },
      standardDeviation: {
        type: Number,
        default: null,
      },
      minimum: {
        type: Number,
        default: null,
      },
      maximum: {
        type: Number,
        default: null,
      },
    },

    // SpO2 baseline
    spo2: {
      average: {
        type: Number,
        default: null,
      },
      standardDeviation: {
        type: Number,
        default: null,
      },
      minimum: {
        type: Number,
        default: null,
      },
      maximum: {
        type: Number,
        default: null,
      },
    },

    // Body temperature baseline
    bodyTemperature: {
      average: {
        type: Number,
        default: null,
      },
      standardDeviation: {
        type: Number,
        default: null,
      },
      minimum: {
        type: Number,
        default: null,
      },
      maximum: {
        type: Number,
        default: null,
      },
    },

    // Activity baseline
    activityMinutes: {
      average: {
        type: Number,
        default: null,
      },
      standardDeviation: {
        type: Number,
        default: null,
      },
      minimum: {
        type: Number,
        default: null,
      },
      maximum: {
        type: Number,
        default: null,
      },
    },

    // Sleep baseline
    sleepHours: {
      average: {
        type: Number,
        default: null,
      },
      standardDeviation: {
        type: Number,
        default: null,
      },
      minimum: {
        type: Number,
        default: null,
      },
      maximum: {
        type: Number,
        default: null,
      },
    },

    // Environmental temperature baseline
    environmentalTemperature: {
      average: {
        type: Number,
        default: null,
      },
      standardDeviation: {
        type: Number,
        default: null,
      },
      minimum: {
        type: Number,
        default: null,
      },
      maximum: {
        type: Number,
        default: null,
      },
    },

    // Humidity baseline
    humidity: {
      average: {
        type: Number,
        default: null,
      },
      standardDeviation: {
        type: Number,
        default: null,
      },
      minimum: {
        type: Number,
        default: null,
      },
      maximum: {
        type: Number,
        default: null,
      },
    },

    // Air Quality Index baseline
    aqi: {
      average: {
        type: Number,
        default: null,
      },
      standardDeviation: {
        type: Number,
        default: null,
      },
      minimum: {
        type: Number,
        default: null,
      },
      maximum: {
        type: Number,
        default: null,
      },
    },

    calculatedAt: {
      type: Date,
      default: Date.now,
    },

    periodStart: {
      type: Date,
      default: null,
    },

    periodEnd: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "PersonalBaseline",
  personalBaselineSchema
);