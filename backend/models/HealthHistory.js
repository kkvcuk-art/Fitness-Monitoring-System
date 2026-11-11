const mongoose = require("mongoose");

const healthHistorySchema =
  new mongoose.Schema(
    {
      /*
       * Family workspace owning this record.
       */
      familyId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Family",
        required: true,
        index: true,
      },

      /*
       * Family member associated with
       * this health-history record.
       */
      memberId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Member",
        required: true,
        index: true,
      },

      conditionName: {
        type: String,

        required: [
          true,
          "Disease or health condition is required",
        ],

        trim: true,

        maxlength: [
          150,
          "Condition name cannot exceed 150 characters",
        ],
      },

      diagnosisDate: {
        type: Date,
        default: null,
      },

      status: {
        type: String,

        enum: [
          "Active",
          "Recovered",
          "Chronic",
          "Under Treatment",
          "Unknown",
        ],

        default: "Active",
      },

      hereditary: {
        type: Boolean,
        default: false,
      },

      treatment: {
        type: String,
        trim: true,

        maxlength: [
          1000,
          "Treatment information cannot exceed 1000 characters",
        ],

        default: "",
      },

      doctorName: {
        type: String,
        trim: true,

        maxlength: [
          120,
          "Doctor name cannot exceed 120 characters",
        ],

        default: "",
      },

      hospitalName: {
        type: String,
        trim: true,

        maxlength: [
          150,
          "Hospital name cannot exceed 150 characters",
        ],

        default: "",
      },

      notes: {
        type: String,
        trim: true,

        maxlength: [
          1500,
          "Health-history notes cannot exceed 1500 characters",
        ],

        default: "",
      },

      createdBy: {
        type:
          mongoose.Schema.Types.ObjectId,

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

healthHistorySchema.index({
  familyId: 1,
  diagnosisDate: -1,
});

healthHistorySchema.index({
  familyId: 1,
  memberId: 1,
  diagnosisDate: -1,
});

healthHistorySchema.index({
  familyId: 1,
  status: 1,
});

healthHistorySchema.index({
  familyId: 1,
  hereditary: 1,
});

/* =========================================================
   EXPORT
   ========================================================= */

module.exports =
  mongoose.model(
    "HealthHistory",
    healthHistorySchema,
  );