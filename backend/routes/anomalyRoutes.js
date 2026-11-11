const express = require("express");
const mongoose = require("mongoose");

const { protect } = require("../middleware/authMiddleware");

const Member = require("../models/Member");
const VitalReading = require("../models/VitalReading");
const PersonalBaseline = require("../models/PersonalBaseline");
const AnomalyEvent = require("../models/AnomalyEvent");

const {
  analyzeHealthAnomalies,
  generateAnomalyReading,
} = require("../services/healthAnomalyService");

const router = express.Router();

router.use(protect);

/**
 * Check whether a family member belongs
 * to the authenticated user's family.
 */
async function getFamilyMember(memberId, familyId) {
  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    return null;
  }

  return Member.findOne({
    _id: memberId,
    familyId,
  });
}

/**
 * POST /api/anomalies/:memberId/simulate
 *
 * Creates a controlled simulated reading
 * for testing and demonstration purposes.
 */
router.post("/:memberId/simulate", async (req, res) => {
  try {
    const { memberId } = req.params;
    const { scenario } = req.body;

    // Verify family-member ownership.
    const member = await getFamilyMember(
      memberId,
      req.user.familyId
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Family member not found.",
      });
    }

    // Supported simulation scenarios.
    const validScenarios = [
      "high_heart_rate",
      "low_spo2",
      "high_temperature",
      "heat_stress",
      "respiratory",
      "fatigue",
    ];

    if (!validScenarios.includes(scenario)) {
      return res.status(400).json({
        success: false,
        message: "Invalid anomaly scenario.",
        validScenarios,
      });
    }

    // Generate the selected simulated reading.
    const readingData =
      generateAnomalyReading(scenario);

    // Store the reading in MongoDB.
    const reading = await VitalReading.create({
      memberId,
      ...readingData,
      source: "demo",
      isSimulated: true,
      recordedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message:
        "Simulated anomaly reading created successfully.",

      scenario,

      reading: {
        id: reading._id,
        memberId: reading.memberId,

        heartRate:
          reading.heartRate ?? null,

        spo2:
          reading.spo2 ?? null,

        bodyTemperature:
          reading.bodyTemperature ?? null,

        activityMinutes:
          reading.activityMinutes ?? null,

        sleepHours:
          reading.sleepHours ?? null,

        environmentalTemperature:
          reading.environmentalTemperature ?? null,

        humidity:
          reading.humidity ?? null,

        aqi:
          reading.aqi ?? null,

        source:
          reading.source,

        isSimulated:
          reading.isSimulated,

        recordedAt:
          reading.recordedAt,
      },
    });
  } catch (error) {
    console.error(
      "Anomaly simulation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create simulated anomaly reading.",
      error: error.message,
    });
  }
});

/**
 * POST /api/anomalies/:memberId/analyze
 *
 * Analyzes the latest vital reading using
 * the member's personal baseline and
 * health-specific contextual rules.
 */
router.post("/:memberId/analyze", async (req, res) => {
  try {
    const { memberId } = req.params;

    // Verify family-member ownership.
    const member = await getFamilyMember(
      memberId,
      req.user.familyId
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Family member not found.",
      });
    }

    // Retrieve the latest vital reading.
    const latestReading =
      await VitalReading.findOne({
        memberId,
      }).sort({
        recordedAt: -1,
      });

    if (!latestReading) {
      return res.status(404).json({
        success: false,
        message:
          "No vital reading is available for this family member.",
      });
    }

    // Retrieve the personal baseline.
    const baseline =
      await PersonalBaseline.findOne({
        memberId,
      });

    if (!baseline) {
      return res.status(404).json({
        success: false,
        message:
          "Personal baseline has not been calculated yet. Please calculate the baseline first.",
      });
    }

    // Run the health anomaly intelligence service.
    const analysis =
      analyzeHealthAnomalies(
        latestReading,
        baseline
      );

    // Save warning and critical alerts.
    const savedEvents = [];

    for (const alert of analysis.alerts) {
      if (
        alert.severity !== "warning" &&
        alert.severity !== "critical"
      ) {
        continue;
      }

      // Identify the relevant baseline field.
      let baselineData = null;

      switch (alert.vitalType) {
        case "heartRate":
          baselineData = baseline.heartRate;
          break;

        case "spo2":
          baselineData = baseline.spo2;
          break;

        case "bodyTemperature":
          baselineData = baseline.bodyTemperature;
          break;

        case "sleepHours":
          baselineData = baseline.sleepHours;
          break;

        case "activityMinutes":
          baselineData = baseline.activityMinutes;
          break;

        default:
          baselineData = null;
      }

      // Calculate deviation when baseline values
      // are available for the corresponding vital.
      let deviationScore = null;

      if (
        baselineData &&
        baselineData.average !== null &&
        baselineData.average !== undefined &&
        baselineData.standardDeviation !== null &&
        baselineData.standardDeviation !== undefined &&
        Number(baselineData.standardDeviation) > 0 &&
        typeof alert.currentValue === "number"
      ) {
        deviationScore = Math.abs(
          (
            Number(alert.currentValue) -
            Number(baselineData.average)
          ) /
          Number(baselineData.standardDeviation)
        );
      }

      // Store the anomaly event.
      const event = await AnomalyEvent.create({
        memberId,

        vitalType:
          alert.vitalType,

        currentValue:
          typeof alert.currentValue === "number"
            ? alert.currentValue
            : null,

        baselineAverage:
          baselineData?.average ?? null,

        baselineStandardDeviation:
          baselineData?.standardDeviation ?? null,

        deviationScore,

        severity:
          alert.severity,

        message:
          alert.message,

        source:
          latestReading.source || "demo",

        detectedAt:
          new Date(),
      });

      savedEvents.push(event);
    }

    return res.status(200).json({
      success: true,

      memberId,

      member: {
        id: member._id,

        name:
          member.name ||
          `${member.firstName || ""} ${
            member.lastName || ""
          }`.trim(),
      },

      reading: {
        id: latestReading._id,

        heartRate:
          latestReading.heartRate ?? null,

        spo2:
          latestReading.spo2 ?? null,

        bodyTemperature:
          latestReading.bodyTemperature ?? null,

        activityMinutes:
          latestReading.activityMinutes ?? null,

        sleepHours:
          latestReading.sleepHours ?? null,

        environmentalTemperature:
          latestReading.environmentalTemperature ?? null,

        humidity:
          latestReading.humidity ?? null,

        aqi:
          latestReading.aqi ?? null,

        source:
          latestReading.source,

        isSimulated:
          latestReading.isSimulated,

        recordedAt:
          latestReading.recordedAt,
      },

      baseline: {
        readingCount:
          baseline.readingCount,

        calculatedAt:
          baseline.calculatedAt,

        periodStart:
          baseline.periodStart,

        periodEnd:
          baseline.periodEnd,
      },

      analysis: {
        overallSeverity:
          analysis.overallSeverity,

        anomalyCount:
          analysis.anomalyCount,

        alerts:
          analysis.alerts,

        analyzedAt:
          analysis.analyzedAt,
      },

      savedEventCount:
        savedEvents.length,
    });
  } catch (error) {
    console.error(
      "Health anomaly analysis error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to analyze health anomalies.",
      error: error.message,
    });
  }
});

/**
 * GET /api/anomalies/:memberId
 *
 * Returns the member's stored anomaly history.
 */
router.get("/:memberId", async (req, res) => {
  try {
    const { memberId } = req.params;

    // Verify family-member ownership.
    const member = await getFamilyMember(
      memberId,
      req.user.familyId
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Family member not found.",
      });
    }

    // Retrieve recent anomaly events.
    const events =
      await AnomalyEvent.find({
        memberId,
      })
        .sort({
          detectedAt: -1,
        })
        .limit(100);

    return res.status(200).json({
      success: true,

      memberId,

      count: events.length,

      events,
    });
  } catch (error) {
    console.error(
      "Anomaly history error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve anomaly history.",
      error: error.message,
    });
  }
});

module.exports = router;