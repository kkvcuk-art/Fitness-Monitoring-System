const mongoose = require("mongoose");

const vaccinationSchema =
  new mongoose.Schema(
    {
      /*
       * Family workspace owning this record.
       */
      familyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Family",
        required: true,
        index: true,
      },

      /*
       * Family member receiving the vaccine.
       */
      memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Member",
        required: true,
        index: true,
      },

      vaccineName: {
        type: String,
        required: [
          true,
          "Vaccine name is required",
        ],
        trim: true,
      },

      dose: {
        type: String,
        trim: true,
        default: "",
      },

      vaccinationDate: {
        type: Date,
        default: null,
      },

      nextDueDate: {
        type: Date,
        default: null,
      },

      status: {
        type: String,
        enum: [
          "Completed",
          "Upcoming",
          "Missed",
        ],
        default: "Completed",
      },

      notes: {
        type: String,
        trim: true,
        maxlength: [
          1000,
          "Vaccination notes cannot exceed 1000 characters",
        ],
        default: "",
      },

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    {
      timestamps: true,
    },
  );

/* =========================================================
   QUERY INDEXES
   ========================================================= */

vaccinationSchema.index({
  familyId: 1,
  vaccinationDate: -1,
});

vaccinationSchema.index({
  familyId: 1,
  memberId: 1,
  vaccinationDate: -1,
});

vaccinationSchema.index({
  familyId: 1,
  status: 1,
  nextDueDate: 1,
});

/* =========================================================
   EXPORT
   ========================================================= */

module.exports =
  mongoose.model(
    "Vaccination",
    vaccinationSchema,
  );