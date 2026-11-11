const express = require("express");
const mongoose = require("mongoose");

const HealthHistory =
  require("../models/HealthHistory");

const Member =
  require("../models/Member");

const {
  protect,
  healthManagerOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

/* =========================================================
   REQUIRE FAMILY WORKSPACE
   ========================================================= */

function requireFamily(
  req,
  res,
  next,
) {
  if (!req.user.familyId) {
    return res.status(403).json({
      success: false,

      message:
        "Your account is not connected to a family workspace.",
    });
  }

  next();
}

router.use(requireFamily);

/* =========================================================
   GET FAMILY HEALTH HISTORY
   GET /api/health-history
   ========================================================= */

router.get(
  "/",
  async (req, res) => {
    try {
      const records =
        await HealthHistory.find({
          familyId:
            req.user.familyId,
        })
          .populate(
            "memberId",
            "fullName dateOfBirth gender bloodGroup healthStatus",
          )
          .sort({
            diagnosisDate: -1,
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        count: records.length,
        data: records,
      });
    } catch (error) {
      console.error(
        "Get health history error:",
        error,
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load health history.",
      });
    }
  },
);

/* =========================================================
   GET ONE HEALTH-HISTORY RECORD
   GET /api/health-history/:id
   ========================================================= */

router.get(
  "/:id",
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id,
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid health-history record ID.",
        });
      }

      const record =
        await HealthHistory.findOne({
          _id: id,

          familyId:
            req.user.familyId,
        }).populate(
          "memberId",
          "fullName dateOfBirth gender bloodGroup healthStatus",
        );

      if (!record) {
        return res.status(404).json({
          success: false,

          message:
            "Health-history record not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: record,
      });
    } catch (error) {
      console.error(
        "Get health-history record error:",
        error,
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load health-history record.",
      });
    }
  },
);

/* =========================================================
   CREATE HEALTH-HISTORY RECORD
   POST /api/health-history
   HEALTH MANAGER ONLY
   ========================================================= */

router.post(
  "/",
  healthManagerOnly,
  async (req, res) => {
    try {
      const {
        memberId,
        conditionName,
        diagnosisDate,
        status,
        hereditary,
        treatment,
        doctorName,
        hospitalName,
        notes,
      } = req.body;

      if (
        !memberId ||
        !conditionName ||
        !String(
          conditionName,
        ).trim()
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Family member and health condition are required.",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          memberId,
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid family member ID.",
        });
      }

      const member =
        await Member.findOne({
          _id: memberId,

          familyId:
            req.user.familyId,
        });

      if (!member) {
        return res.status(404).json({
          success: false,

          message:
            "Family member not found in your family.",
        });
      }

      let diagnosisDateValue =
        null;

      if (diagnosisDate) {
        diagnosisDateValue =
          new Date(
            diagnosisDate,
          );

        if (
          Number.isNaN(
            diagnosisDateValue.getTime(),
          )
        ) {
          return res.status(400).json({
            success: false,

            message:
              "Please enter a valid diagnosis date.",
          });
        }
      }

      let record =
        await HealthHistory.create({
          familyId:
            req.user.familyId,

          memberId:
            member._id,

          conditionName:
            String(
              conditionName,
            ).trim(),

          diagnosisDate:
            diagnosisDateValue,

          status:
            status || "Active",

          hereditary:
            hereditary === true,

          treatment:
            treatment || "",

          doctorName:
            doctorName || "",

          hospitalName:
            hospitalName || "",

          notes:
            notes || "",

          createdBy:
            req.user._id,
        });

      record =
        await record.populate(
          "memberId",
          "fullName dateOfBirth gender bloodGroup healthStatus",
        );

      return res.status(201).json({
        success: true,

        message:
          "Health-history record added successfully.",

        data: record,
      });
    } catch (error) {
      console.error(
        "Create health-history error:",
        error,
      );

      if (
        error.name ===
        "ValidationError"
      ) {
        const messages =
          Object.values(
            error.errors,
          ).map(
            (item) =>
              item.message,
          );

        return res.status(400).json({
          success: false,

          message:
            messages.join(", "),
        });
      }

      return res.status(500).json({
        success: false,

        message:
          "Unable to save health-history record.",
      });
    }
  },
);

/* =========================================================
   UPDATE HEALTH-HISTORY RECORD
   PUT /api/health-history/:id
   HEALTH MANAGER ONLY
   ========================================================= */

router.put(
  "/:id",
  healthManagerOnly,
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id,
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid health-history record ID.",
        });
      }

      const updateData = {};

      const allowedFields = [
        "conditionName",
        "diagnosisDate",
        "status",
        "hereditary",
        "treatment",
        "doctorName",
        "hospitalName",
        "notes",
      ];

      allowedFields.forEach(
        (field) => {
          if (
            req.body[field] !==
            undefined
          ) {
            updateData[field] =
              req.body[field];
          }
        },
      );

      if (req.body.memberId) {
        if (
          !mongoose.Types.ObjectId.isValid(
            req.body.memberId,
          )
        ) {
          return res.status(400).json({
            success: false,

            message:
              "Invalid family member ID.",
          });
        }

        const member =
          await Member.findOne({
            _id:
              req.body.memberId,

            familyId:
              req.user.familyId,
          });

        if (!member) {
          return res.status(404).json({
            success: false,

            message:
              "Family member not found in your family.",
          });
        }

        updateData.memberId =
          member._id;
      }

      if (
        updateData.conditionName !==
        undefined
      ) {
        const conditionName =
          String(
            updateData.conditionName,
          ).trim();

        if (!conditionName) {
          return res.status(400).json({
            success: false,

            message:
              "Health condition is required.",
          });
        }

        updateData.conditionName =
          conditionName;
      }

      if (
        updateData.diagnosisDate ===
        ""
      ) {
        updateData.diagnosisDate =
          null;
      } else if (
        updateData.diagnosisDate
      ) {
        const parsedDate =
          new Date(
            updateData.diagnosisDate,
          );

        if (
          Number.isNaN(
            parsedDate.getTime(),
          )
        ) {
          return res.status(400).json({
            success: false,

            message:
              "Please enter a valid diagnosis date.",
          });
        }

        updateData.diagnosisDate =
          parsedDate;
      }

      if (
        updateData.hereditary !==
        undefined
      ) {
        updateData.hereditary =
          updateData.hereditary ===
          true;
      }

      const record =
        await HealthHistory.findOneAndUpdate(
          {
            _id: id,

            familyId:
              req.user.familyId,
          },

          updateData,

          {
            new: true,
            runValidators: true,
          },
        ).populate(
          "memberId",
          "fullName dateOfBirth gender bloodGroup healthStatus",
        );

      if (!record) {
        return res.status(404).json({
          success: false,

          message:
            "Health-history record not found.",
        });
      }

      return res.status(200).json({
        success: true,

        message:
          "Health-history record updated successfully.",

        data: record,
      });
    } catch (error) {
      console.error(
        "Update health-history error:",
        error,
      );

      if (
        error.name ===
        "ValidationError"
      ) {
        const messages =
          Object.values(
            error.errors,
          ).map(
            (item) =>
              item.message,
          );

        return res.status(400).json({
          success: false,

          message:
            messages.join(", "),
        });
      }

      return res.status(500).json({
        success: false,

        message:
          "Unable to update health-history record.",
      });
    }
  },
);

/* =========================================================
   DELETE HEALTH-HISTORY RECORD
   DELETE /api/health-history/:id
   HEALTH MANAGER ONLY
   ========================================================= */

router.delete(
  "/:id",
  healthManagerOnly,
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id,
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid health-history record ID.",
        });
      }

      const record =
        await HealthHistory.findOneAndDelete({
          _id: id,

          familyId:
            req.user.familyId,
        });

      if (!record) {
        return res.status(404).json({
          success: false,

          message:
            "Health-history record not found.",
        });
      }

      return res.status(200).json({
        success: true,

        message:
          "Health-history record deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete health-history error:",
        error,
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to delete health-history record.",
      });
    }
  },
);

module.exports = router;