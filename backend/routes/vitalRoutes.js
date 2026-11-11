const express = require("express");
const mongoose = require("mongoose");

const VitalReading = require("../models/VitalReading");
const Member = require("../models/Member");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

/* =========================================================
   ALL VITAL ROUTES REQUIRE LOGIN
   ========================================================= */

router.use(protect);

/* =========================================================
   CHECK FAMILY ACCESS
   ========================================================= */

async function getFamilyMember(
  memberId,
  familyId,
) {
  if (
    !mongoose.Types.ObjectId.isValid(
      memberId,
    )
  ) {
    return null;
  }

  return Member.findOne({
    _id: memberId,
    familyId,
  });
}

/* =========================================================
   CREATE VITAL READING
   POST /api/vitals/readings
   ========================================================= */

router.post(
  "/readings",
  async (req, res) => {
    try {
      const {
        memberId,
        heartRate,
        spo2,
        bodyTemperature,
        activityMinutes,
        sleepHours,
        environmentalTemperature,
        humidity,
        aqi,
        source,
        recordedAt,
      } = req.body;

      /* ---------------------------------------------------
         BASIC VALIDATION
         --------------------------------------------------- */

      if (!memberId) {
        return res.status(400).json({
          success: false,
          message:
            "Family member ID is required.",
        });
      }

      /* ---------------------------------------------------
         CHECK THAT MEMBER BELONGS TO USER'S FAMILY
         --------------------------------------------------- */

      const member =
        await getFamilyMember(
          memberId,
          req.user.familyId,
        );

      if (!member) {
        return res.status(404).json({
          success: false,
          message:
            "Family member not found.",
        });
      }

      /* ---------------------------------------------------
         CREATE READING
         --------------------------------------------------- */

      const reading =
        await VitalReading.create({
          memberId,

          heartRate:
            heartRate !== undefined
              ? Number(heartRate)
              : undefined,

          spo2:
            spo2 !== undefined
              ? Number(spo2)
              : undefined,

          bodyTemperature:
            bodyTemperature !== undefined
              ? Number(bodyTemperature)
              : undefined,

          activityMinutes:
            activityMinutes !== undefined
              ? Number(activityMinutes)
              : 0,

          sleepHours:
            sleepHours !== undefined
              ? Number(sleepHours)
              : undefined,

          environmentalTemperature:
            environmentalTemperature !==
            undefined
              ? Number(
                  environmentalTemperature,
                )
              : undefined,

          humidity:
            humidity !== undefined
              ? Number(humidity)
              : undefined,

          aqi:
            aqi !== undefined
              ? Number(aqi)
              : undefined,

          source:
            source || "demo",

          isSimulated:
            !source ||
            source === "demo",

          recordedAt:
            recordedAt
              ? new Date(recordedAt)
              : new Date(),
        });

      return res.status(201).json({
        success: true,
        message:
          "Vital reading recorded successfully.",
        data: reading,
      });
    } catch (error) {
      console.error(
        "Create vital reading error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to record vital reading.",
      });
    }
  },
);

/* =========================================================
   GET RECENT VITAL READINGS
   GET /api/vitals/readings/:memberId
   ========================================================= */

router.get(
  "/readings/:memberId",
  async (req, res) => {
    try {
      const {
        memberId,
      } = req.params;

      const member =
        await getFamilyMember(
          memberId,
          req.user.familyId,
        );

      if (!member) {
        return res.status(404).json({
          success: false,
          message:
            "Family member not found.",
        });
      }

      /* ---------------------------------------------------
         LIMIT
         --------------------------------------------------- */

      let limit =
        Number(req.query.limit) || 50;

      limit = Math.min(
        Math.max(limit, 1),
        200,
      );

      /* ---------------------------------------------------
         FETCH READINGS
         --------------------------------------------------- */

      const readings =
        await VitalReading.find({
          memberId,
        })
          .sort({
            recordedAt: -1,
          })
          .limit(limit)
          .lean();

      return res.status(200).json({
        success: true,
        count: readings.length,
        data: readings,
      });
    } catch (error) {
      console.error(
        "Get vital readings error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch vital readings.",
      });
    }
  },
);

/* =========================================================
   GET LATEST VITAL READING
   GET /api/vitals/latest/:memberId
   ========================================================= */

router.get(
  "/latest/:memberId",
  async (req, res) => {
    try {
      const {
        memberId,
      } = req.params;

      const member =
        await getFamilyMember(
          memberId,
          req.user.familyId,
        );

      if (!member) {
        return res.status(404).json({
          success: false,
          message:
            "Family member not found.",
        });
      }

      const reading =
        await VitalReading.findOne({
          memberId,
        })
          .sort({
            recordedAt: -1,
          })
          .lean();

      if (!reading) {
        return res.status(404).json({
          success: false,
          message:
            "No vital readings found for this member.",
        });
      }

      return res.status(200).json({
        success: true,
        data: reading,
      });
    } catch (error) {
      console.error(
        "Get latest vital reading error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch latest vital reading.",
      });
    }
  },
);

/* =========================================================
   DELETE OLD DEMO READINGS
   DELETE /api/vitals/readings/demo
   =========================================================

   This is useful during development.

   It removes only simulated/demo readings belonging
   to the current user's family.
   ========================================================= */

router.delete(
  "/readings/demo",
  async (req, res) => {
    try {
      const members =
        await Member.find({
          familyId:
            req.user.familyId,
        }).select("_id");

      const memberIds =
        members.map(
          (member) => member._id,
        );

      const result =
        await VitalReading.deleteMany({
          memberId: {
            $in: memberIds,
          },
          source: "demo",
        });

      return res.status(200).json({
        success: true,
        message:
          "Demo vital readings deleted.",
        deletedCount:
          result.deletedCount,
      });
    } catch (error) {
      console.error(
        "Delete demo readings error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to delete demo readings.",
      });
    }
  },
);

module.exports = router;