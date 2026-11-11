const express = require("express");
const mongoose = require("mongoose");

const Member = require("../models/Member");
const { calculateDiseaseRisks } = require("./aiRoutes");

const {
  protect,
  healthManagerOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

function attachRiskAnalysisToMember(member) {
  if (!member) return member;
  const obj = member.toObject ? member.toObject({ virtuals: true }) : { ...member };
  const age = obj.age || 35;
  const bmi = obj.bmi || 24;
  let hereditaryScore = 2;
  if (obj.familyDiseases && String(obj.familyDiseases).trim().length > 0) {
    hereditaryScore = Math.min(10, 4 + Math.floor(String(obj.familyDiseases).length / 10));
  }
  const riskAnalysis = calculateDiseaseRisks({
    age,
    bmi,
    systolicBp: obj.systolicBp || 120,
    diastolicBp: obj.diastolicBp || 80,
    fastingGlucose: obj.fastingGlucose || 95,
    cholesterol: obj.cholesterol || 190,
    sleepHours: obj.sleepHours || 7,
    activityMinutes: obj.activityMinutes || 30,
    hereditaryScore,
  });
  obj.riskAnalysis = riskAnalysis;
  return obj;
}

/* =========================================================
   CHECK FAMILY WORKSPACE
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

function calculateHealthStatus(vitals) {
  const sBp = Number(vitals.systolicBp) || 120;
  const glucose = Number(vitals.fastingGlucose) || 95;
  const bmi = Number(vitals.bmi) || 24;
  const chol = Number(vitals.cholesterol) || 190;
  const diseases = String(vitals.previousDiseases || "").toLowerCase();

  if (sBp >= 140 || glucose >= 135 || chol >= 240 || diseases.includes("critical") || diseases.includes("stroke") || diseases.includes("heart attack") || diseases.includes("cancer")) {
    return "Critical";
  }
  if (sBp >= 130 || glucose >= 105 || bmi >= 27 || chol >= 210 || diseases.trim().length > 0) {
    return "Needs Attention";
  }
  return "Good";
}

router.use(requireFamily);

/* =========================================================
   GET FAMILY MEMBERS
   GET /api/members
   ========================================================= */

router.get("/", async (req, res) => {
  try {
    const members =
      await Member.find({
        familyId:
          req.user.familyId,
      }).sort({
        createdAt: -1,
      });

    const membersWithRisk = members.map(attachRiskAnalysisToMember);

    return res.status(200).json({
      success: true,
      count: membersWithRisk.length,
      data: membersWithRisk,
    });
  } catch (error) {
    console.error(
      "Get members error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch family members",
    });
  }
});

/* =========================================================
   GET ONE MEMBER
   GET /api/members/:id
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
          "Invalid family member ID",
      });
    }

    const member =
      await Member.findOne({
        _id: id,

        familyId:
          req.user.familyId,
      });

    if (!member) {
      return res.status(404).json({
        success: false,
        message:
          "Family member not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: attachRiskAnalysisToMember(member),
    });
  } catch (error) {
    console.error(
      "Get member error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch family member",
    });
  }
});

/* =========================================================
   ADD MEMBER
   POST /api/members
   Health Manager only
   ========================================================= */

router.post(
  "/",
  healthManagerOnly,
  async (req, res) => {
    try {
      const {
        fullName,
        dateOfBirth,
        gender,
        bloodGroup,
        phone,
        email,
        allergies,
        previousDiseases,
        surgeryHistory,
        vaccinationHistory,
        familyDiseases,
        additionalHealthNotes,
        healthStatus,
        isLiving,
      } = req.body;

      if (
        !fullName ||
        !dateOfBirth
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Full name and date of birth are required",
        });
      }

      const parsedDateOfBirth =
        new Date(dateOfBirth);

      if (
        Number.isNaN(
          parsedDateOfBirth.getTime(),
        ) ||
        parsedDateOfBirth > new Date()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid date of birth",
        });
      }

      const member =
        await Member.create({
          familyId:
            req.user.familyId,

          createdBy:
            req.user._id,

          fullName:
            String(fullName).trim(),

          dateOfBirth:
            parsedDateOfBirth,

          gender:
            gender ||
            "Not specified",

          bloodGroup:
            bloodGroup ||
            "Unknown",

          phone:
            phone || "",

          email:
            email || "",

          emergencyContactName:
            req.body.emergencyContactName || "",

          emergencyContactPhone:
            req.body.emergencyContactPhone || req.body.phone || "",

          allergies:
            allergies || "",

          previousDiseases:
            previousDiseases || "",

          surgeryHistory:
            surgeryHistory || "",

          vaccinationHistory:
            vaccinationHistory || "",

          familyDiseases:
            familyDiseases || "",

          additionalHealthNotes:
            additionalHealthNotes || "",

          weightKg: Number(req.body.weightKg) || 68,
          heightCm: Number(req.body.heightCm) || 168,
          systolicBp: Number(req.body.systolicBp) || 120,
          diastolicBp: Number(req.body.diastolicBp) || 80,
          fastingGlucose: Number(req.body.fastingGlucose) || 95,
          cholesterol: Number(req.body.cholesterol) || 190,
          sleepHours: Number(req.body.sleepHours) || 7.0,
          activityMinutes: Number(req.body.activityMinutes) || 30,

          healthStatus:
            calculateHealthStatus(req.body),

          isLiving:
            isLiving !== undefined
              ? Boolean(isLiving)
              : true,
        });

      return res.status(201).json({
        success: true,
        message:
          "Family member added successfully",
        data: attachRiskAnalysisToMember(member),
      });
    } catch (error) {
      console.error(
        "Add member error:",
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
          "Unable to add family member",
      });
    }
  },
);

/* =========================================================
   UPDATE MEMBER
   PUT /api/members/:id
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
            "Invalid family member ID",
        });
      }

      const allowedFields = [
        "fullName",
        "dateOfBirth",
        "gender",
        "bloodGroup",
        "phone",
        "email",
        "allergies",
        "previousDiseases",
        "surgeryHistory",
        "vaccinationHistory",
        "familyDiseases",
        "additionalHealthNotes",
        "healthStatus",
        "isLiving",
      ];

      const updateData = {};

      allowedFields.forEach((field) => {
        if (
          req.body[field] !==
          undefined
        ) {
          updateData[field] =
            req.body[field];
        }
      });

      if (
        updateData.dateOfBirth
      ) {
        const parsedDate =
          new Date(
            updateData.dateOfBirth,
          );

        if (
          Number.isNaN(
            parsedDate.getTime(),
          ) ||
          parsedDate > new Date()
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Please enter a valid date of birth",
          });
        }

        updateData.dateOfBirth =
          parsedDate;
      }

      const member =
        await Member.findOneAndUpdate(
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
        );

      if (!member) {
        return res.status(404).json({
          success: false,
          message:
            "Family member not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Family member updated successfully",
        data: member,
      });
    } catch (error) {
      console.error(
        "Update member error:",
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
          "Unable to update family member",
      });
    }
  },
);

/* =========================================================
   DELETE MEMBER
   DELETE /api/members/:id
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
            "Invalid family member ID",
        });
      }

      /*
       * Do not delete the logged-in user's
       * own linked profile.
       */
      if (
        req.user.memberProfileId &&
        String(
          req.user.memberProfileId,
        ) === String(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot delete your own family profile.",
        });
      }

      const member =
        await Member.findOneAndDelete({
          _id: id,

          familyId:
            req.user.familyId,
        });

      if (!member) {
        return res.status(404).json({
          success: false,
          message:
            "Family member not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Family member deleted successfully",
        data: member,
      });
    } catch (error) {
      console.error(
        "Delete member error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to delete family member",
      });
    }
  },
);

module.exports = router;