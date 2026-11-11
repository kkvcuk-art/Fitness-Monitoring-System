const express = require("express");
const mongoose = require("mongoose");

const MedicalReport =
  require("../models/MedicalReport");

const Member =
  require("../models/Member");

const {
  protect,
  healthManagerOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

/* =========================================================
   REQUIRE FAMILY
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
   GET FAMILY MEDICAL REPORTS
   GET /api/medical-reports
   ========================================================= */

router.get("/", async (req, res) => {
  try {
    const reports =
      await MedicalReport.find({
        familyId:
          req.user.familyId,
      })
        .populate(
          "memberId",
          "fullName dateOfBirth gender bloodGroup healthStatus",
        )
        .sort({
          recordDate: -1,
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error(
      "Get reports error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch medical reports",
    });
  }
});

/* =========================================================
   GET ONE FAMILY REPORT
   GET /api/medical-reports/:id
   ========================================================= */

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid medical report ID",
      });
    }

    const report =
      await MedicalReport.findOne({
        _id: id,

        familyId:
          req.user.familyId,
      }).populate(
        "memberId",
        "fullName dateOfBirth gender bloodGroup healthStatus",
      );

    if (!report) {
      return res.status(404).json({
        success: false,
        message:
          "Medical report not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error(
      "Get report error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch medical report",
    });
  }
});

/* =========================================================
   CREATE REPORT
   POST /api/medical-reports
   Health Manager only
   ========================================================= */

router.post(
  "/",
  healthManagerOnly,
  async (req, res) => {
    try {
      const {
        memberId,
        recordType,
        value,
        recordDate,
        status,
        notes,
      } = req.body;

      if (
        !memberId ||
        !recordType ||
        !value ||
        !recordDate
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Family member, record type, value and date are required",
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
            "Invalid family member ID",
        });
      }

      /*
       * Member must belong to the same family.
       */
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
            "Family member not found in your family",
        });
      }

      const parsedRecordDate =
        new Date(recordDate);

      if (
        Number.isNaN(
          parsedRecordDate.getTime(),
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid record date",
        });
      }

      const report =
        await MedicalReport.create({
          familyId:
            req.user.familyId,

          memberId:
            member._id,

          memberName:
            member.fullName,

          recordType:
            String(recordType).trim(),

          value:
            String(value).trim(),

          recordDate:
            parsedRecordDate,

          status:
            status || "Normal",

          notes:
            notes || "",

          createdBy:
            req.user._id,
        });

      return res.status(201).json({
        success: true,
        message:
          "Medical report added successfully",
        data: report,
      });
    } catch (error) {
      console.error(
        "Create report error:",
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
          "Unable to create medical report",
      });
    }
  },
);

/* =========================================================
   UPDATE REPORT
   PUT /api/medical-reports/:id
   Health Manager only
   ========================================================= */

router.put(
  "/:id",
  healthManagerOnly,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid medical report ID",
        });
      }

      const updateData = {};

      const allowedFields = [
        "recordType",
        "value",
        "recordDate",
        "status",
        "notes",
      ];

      allowedFields.forEach((field) => {
        if (
          req.body[field] !==
          undefined
        ) {
          updateData[field] =
            req.body[field];
        }
      });

      /*
       * If member changes, verify same-family ownership.
       */
      if (req.body.memberId) {
        if (
          !mongoose.Types.ObjectId.isValid(
            req.body.memberId,
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid family member ID",
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
              "Family member not found in your family",
          });
        }

        updateData.memberId =
          member._id;

        updateData.memberName =
          member.fullName;
      }

      if (updateData.recordDate) {
        const parsedDate =
          new Date(
            updateData.recordDate,
          );

        if (
          Number.isNaN(
            parsedDate.getTime(),
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Please enter a valid record date",
          });
        }

        updateData.recordDate =
          parsedDate;
      }

      const report =
        await MedicalReport.findOneAndUpdate(
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

      if (!report) {
        return res.status(404).json({
          success: false,
          message:
            "Medical report not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Medical report updated successfully",
        data: report,
      });
    } catch (error) {
      console.error(
        "Update report error:",
        error,
      );

      if (
        error.name ===
        "ValidationError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to update medical report",
      });
    }
  },
);

/* =========================================================
   DELETE REPORT
   DELETE /api/medical-reports/:id
   Health Manager only
   ========================================================= */

router.delete(
  "/:id",
  healthManagerOnly,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid medical report ID",
        });
      }

      const report =
        await MedicalReport.findOneAndDelete({
          _id: id,

          familyId:
            req.user.familyId,
        });

      if (!report) {
        return res.status(404).json({
          success: false,
          message:
            "Medical report not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Medical report deleted successfully",
        data: report,
      });
    } catch (error) {
      console.error(
        "Delete report error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to delete medical report",
      });
    }
  },
);

module.exports = router;