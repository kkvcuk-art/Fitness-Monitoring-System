const express = require("express");
const mongoose = require("mongoose");

const { protect } = require("../middleware/authMiddleware");
const Member = require("../models/Member");
const VitalReading = require("../models/VitalReading");
const PersonalBaseline = require("../models/PersonalBaseline");

const router = express.Router();

router.use(protect);

// Calculate average, standard deviation, minimum and maximum
function calculateStatistics(values) {
  if (!values || values.length === 0) {
    return {
      average: null,
      standardDeviation: null,
      minimum: null,
      maximum: null,
    };
  }

  const average =
    values.reduce((sum, value) => sum + value, 0) / values.length;

  const variance =
    values.reduce((sum, value) => {
      return sum + Math.pow(value - average, 2);
    }, 0) / values.length;

  const standardDeviation = Math.sqrt(variance);

  return {
    average: Number(average.toFixed(2)),
    standardDeviation: Number(standardDeviation.toFixed(2)),
    minimum: Math.min(...values),
    maximum: Math.max(...values),
  };
}

// Verify that the member belongs to the logged-in user's family
async function getFamilyMember(memberId, familyId) {
  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    return null;
  }

  return Member.findOne({
    _id: memberId,
    familyId: familyId,
  });
}

/*
 * POST
 * /api/baseline/:memberId/calculate
 *
 * Calculates the personal health baseline
 * using the member's stored vital readings.
 */
router.post("/:memberId/calculate", async (req, res) => {
  try {
    const { memberId } = req.params;

    const member = await getFamilyMember(
      memberId,
      req.user.familyId
    );

    if (!member) {
      return res.status(404).json({
        message: "Family member not found",
      });
    }

    const readings = await VitalReading.find({
      memberId: memberId,
    })
      .sort({ recordedAt: 1 })
      .limit(200);

    if (readings.length === 0) {
      return res.status(400).json({
        message:
          "No vital readings available. Add some health readings before calculating a baseline.",
      });
    }

    // Extract heart-rate values
    const heartRates = readings
      .map((reading) => reading.heartRate)
      .filter((value) => typeof value === "number");

    // Extract SpO2 values
    const spo2Values = readings
      .map((reading) => reading.spo2)
      .filter((value) => typeof value === "number");

    // Extract body-temperature values
    const bodyTemperatures = readings
      .map((reading) => reading.bodyTemperature)
      .filter((value) => typeof value === "number");

    // Extract activity values
    const activityMinutes = readings
      .map((reading) => reading.activityMinutes)
      .filter((value) => typeof value === "number");

    // Extract sleep values
    const sleepHours = readings
      .map((reading) => reading.sleepHours)
      .filter((value) => typeof value === "number");

    // Extract environmental temperature
    const environmentalTemperatures = readings
      .map((reading) => reading.environmentalTemperature)
      .filter((value) => typeof value === "number");

    // Extract humidity
    const humidityValues = readings
      .map((reading) => reading.humidity)
      .filter((value) => typeof value === "number");

    // Extract AQI
    const aqiValues = readings
      .map((reading) => reading.aqi)
      .filter((value) => typeof value === "number");

    // Determine baseline period
    const dates = readings
      .map((reading) => reading.recordedAt)
      .filter((date) => date instanceof Date);

    const periodStart =
      dates.length > 0 ? dates[0] : null;

    const periodEnd =
      dates.length > 0
        ? dates[dates.length - 1]
        : null;

    // Prepare baseline
    const baselineData = {
      memberId,

      readingCount: readings.length,

      heartRate: calculateStatistics(heartRates),

      spo2: calculateStatistics(spo2Values),

      bodyTemperature:
        calculateStatistics(bodyTemperatures),

      activityMinutes:
        calculateStatistics(activityMinutes),

      sleepHours:
        calculateStatistics(sleepHours),

      environmentalTemperature:
        calculateStatistics(environmentalTemperatures),

      humidity:
        calculateStatistics(humidityValues),

      aqi:
        calculateStatistics(aqiValues),

      calculatedAt: new Date(),

      periodStart,

      periodEnd,
    };

    // Create or update the baseline
    const baseline =
      await PersonalBaseline.findOneAndUpdate(
        {
          memberId,
        },
        baselineData,
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

    return res.status(200).json({
      message:
        "Personal health baseline calculated successfully",
      baseline,
    });
  } catch (error) {
    console.error(
      "Calculate baseline error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to calculate personal health baseline",
      error: error.message,
    });
  }
});

/*
 * GET
 * /api/baseline/:memberId
 *
 * Returns the stored baseline.
 */
router.get("/:memberId", async (req, res) => {
  try {
    const { memberId } = req.params;

    const member = await getFamilyMember(
      memberId,
      req.user.familyId
    );

    if (!member) {
      return res.status(404).json({
        message: "Family member not found",
      });
    }

    const baseline =
      await PersonalBaseline.findOne({
        memberId,
      });

    if (!baseline) {
      return res.status(404).json({
        message:
          "Personal baseline has not been calculated yet",
      });
    }

    return res.status(200).json({
      baseline,
    });
  } catch (error) {
    console.error(
      "Get baseline error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to retrieve personal baseline",
      error: error.message,
    });
  }
});

module.exports = router;