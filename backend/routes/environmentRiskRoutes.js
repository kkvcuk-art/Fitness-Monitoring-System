const express = require("express");
const mongoose = require("mongoose");

const { protect } = require("../middleware/authMiddleware");
const Member = require("../models/Member");
const VitalReading = require("../models/VitalReading");

const {
  analyzeEnvironmentalRisks,
} = require("../services/environmentRiskService");

const router = express.Router();

router.use(protect);

/*
 * ---------------------------------------------------------
 * CHECK FAMILY MEMBER OWNERSHIP
 * ---------------------------------------------------------
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

/*
 * ---------------------------------------------------------
 * ANALYZE ENVIRONMENTAL RISKS
 * ---------------------------------------------------------
 *
 * POST /api/environment-risk/:memberId/analyze
 *
 * Combines:
 * - Current environmental data
 * - Latest vital reading
 *
 * and returns:
 * - Heat-stress context
 * - Dehydration context
 * - Respiratory context
 * - Overall status
 *
 * Environmental data is supplied by the frontend because
 * the frontend already obtains the permitted location.
 * ---------------------------------------------------------
 */

router.post("/:memberId/analyze", async (req, res) => {
  try {
    const { memberId } = req.params;

    /*
     * Verify that the member belongs to the
     * authenticated user's family.
     */

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

    /*
     * Get the latest vital reading.
     */

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

    /*
     * Environmental data is expected from the
     * frontend request body.
     */

    const { environment } = req.body;

    if (!environment) {
      return res.status(400).json({
        success: false,
        message:
          "Environmental data is required.",
      });
    }

    /*
     * Run environmental risk analysis.
     */

    const analysis =
      analyzeEnvironmentalRisks(
        environment,
        latestReading
      );

    return res.status(200).json({
      success: true,

      memberId,

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
        recordedAt:
          latestReading.recordedAt,
      },

      environment,

      analysis,
    });
  } catch (error) {
    console.error(
      "Environmental risk analysis error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to analyze environmental risks.",
      error: error.message,
    });
  }
});

module.exports = router;