const express = require("express");
const mongoose = require("mongoose");

const Vaccination =
  require("../models/Vaccination");

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
   GET FAMILY VACCINATIONS
   GET /api/vaccinations
   ========================================================= */

router.get("/", async (req, res) => {
  try {
    const vaccinations =
      await Vaccination.find({
        familyId:
          req.user.familyId,
      })
        .populate(
          "memberId",
          "fullName dateOfBirth gender bloodGroup healthStatus",
        )
        .sort({
          vaccinationDate: -1,
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count:
        vaccinations.length,
      data:
        vaccinations,
    });
  } catch (error) {
    console.error(
      "Get vaccinations error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load vaccination records.",
    });
  }
});

/* =========================================================
   GET ONE VACCINATION
   GET /api/vaccinations/:id
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
          "Invalid vaccination record ID.",
      });
    }

    const vaccination =
      await Vaccination.findOne({
        _id: id,

        familyId:
          req.user.familyId,
      }).populate(
        "memberId",
        "fullName dateOfBirth gender bloodGroup healthStatus",
      );

    if (!vaccination) {
      return res.status(404).json({
        success: false,
        message:
          "Vaccination record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data:
        vaccination,
    });
  } catch (error) {
    console.error(
      "Get vaccination error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load vaccination record.",
    });
  }
});

/* =========================================================
   CREATE VACCINATION
   POST /api/vaccinations
   Health Manager only
   ========================================================= */

router.post(
  "/",
  healthManagerOnly,
  async (req, res) => {
    try {
      const {
        memberId,
        vaccineName,
        dose,
        vaccinationDate,
        nextDueDate,
        status,
        notes,
      } = req.body;

      if (
        !memberId ||
        !vaccineName
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Family member and vaccine name are required.",
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
            "Family member not found in your family.",
        });
      }

      let vaccinationDateValue =
        null;

      let nextDueDateValue =
        null;

      if (vaccinationDate) {
        vaccinationDateValue =
          new Date(
            vaccinationDate,
          );

        if (
          Number.isNaN(
            vaccinationDateValue.getTime(),
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Please enter a valid vaccination date.",
          });
        }
      }

      if (nextDueDate) {
        nextDueDateValue =
          new Date(nextDueDate);

        if (
          Number.isNaN(
            nextDueDateValue.getTime(),
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Please enter a valid next due date.",
          });
        }
      }

      let vaccination =
        await Vaccination.create({
          familyId:
            req.user.familyId,

          memberId:
            member._id,

          vaccineName:
            String(
              vaccineName,
            ).trim(),

          dose:
            dose || "",

          vaccinationDate:
            vaccinationDateValue,

          nextDueDate:
            nextDueDateValue,

          status:
            status || "Completed",

          notes:
            notes || "",

          createdBy:
            req.user._id,
        });

      vaccination =
        await vaccination.populate(
          "memberId",
          "fullName dateOfBirth gender bloodGroup healthStatus",
        );

      return res.status(201).json({
        success: true,
        message:
          "Vaccination added successfully.",
        data:
          vaccination,
      });
    } catch (error) {
      console.error(
        "Create vaccination error:",
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
          "Unable to save vaccination.",
      });
    }
  },
);

/* =========================================================
   UPDATE VACCINATION
   PUT /api/vaccinations/:id
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
            "Invalid vaccination record ID.",
        });
      }

      const updateData = {};

      const allowedFields = [
        "vaccineName",
        "dose",
        "vaccinationDate",
        "nextDueDate",
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

      const dateFields = [
        "vaccinationDate",
        "nextDueDate",
      ];

      for (const field of dateFields) {
        if (
          updateData[field] === ""
        ) {
          updateData[field] = null;
        } else if (
          updateData[field]
        ) {
          const parsedDate =
            new Date(
              updateData[field],
            );

          if (
            Number.isNaN(
              parsedDate.getTime(),
            )
          ) {
            return res.status(400).json({
              success: false,
              message:
                `Please enter a valid ${field}.`,
            });
          }

          updateData[field] =
            parsedDate;
        }
      }

      const vaccination =
        await Vaccination.findOneAndUpdate(
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

      if (!vaccination) {
        return res.status(404).json({
          success: false,
          message:
            "Vaccination record not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Vaccination updated successfully.",
        data:
          vaccination,
      });
    } catch (error) {
      console.error(
        "Update vaccination error:",
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
          "Unable to update vaccination.",
      });
    }
  },
);

/* =========================================================
   DELETE VACCINATION
   DELETE /api/vaccinations/:id
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
            "Invalid vaccination record ID.",
        });
      }

      const vaccination =
        await Vaccination.findOneAndDelete({
          _id: id,

          familyId:
            req.user.familyId,
        });

      if (!vaccination) {
        return res.status(404).json({
          success: false,
          message:
            "Vaccination record not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Vaccination deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete vaccination error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to delete vaccination.",
      });
    }
  },
);

module.exports = router;