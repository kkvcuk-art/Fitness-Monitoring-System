const mongoose = require("mongoose");

const medicalReportSchema =
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
       * Family member whose health record this is.
       */
      memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Member",
        required: true,
        index: true,
      },

      /*
       * Name snapshot for convenient display.
       * Actual member remains linked using memberId.
       */
      memberName: {
        type: String,
        required: true,
        trim: true,
      },

      recordType: {
        type: String,
        required: [
          true,
          "Record type is required",
        ],
        trim: true,
      },

      category: {
        type: String,
        enum: [
          "Lab Reports",
          "Prescriptions",
          "Outpatient Notes",
          "Imaging Records",
          "Other",
        ],
        default: "Lab Reports",
      },

      value: {
        type: String,
        required: [
          true,
          "Record value is required",
        ],
        trim: true,
      },

      recordDate: {
        type: Date,
        required: [
          true,
          "Record date is required",
        ],
      },

      status: {
        type: String,
        enum: [
          "Normal",
          "Attention",
          "High",
          "Critical",
        ],
        default: "Normal",
      },

      notes: {
        type: String,
        trim: true,
        maxlength: [
          1000,
          "Notes cannot exceed 1000 characters",
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

medicalReportSchema.index({
  familyId: 1,
  recordDate: -1,
});

medicalReportSchema.index({
  familyId: 1,
  memberId: 1,
  recordDate: -1,
});

/* =========================================================
   EXPORT
   ========================================================= */

module.exports =
  mongoose.model(
    "MedicalReport",
    medicalReportSchema,
  );