const mongoose = require("mongoose");

/* =========================================================
   RELATIONSHIP SCHEMA
   ========================================================= */

const relationshipSchema =
  new mongoose.Schema(
    {
      /*
       * Family workspace containing both people.
       */
      familyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Family",
        required: true,
        index: true,
      },

      /*
       * Person from whom the relationship starts.
       *
       * For parent:
       * fromMember is the parent.
       */
      fromMember: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Member",
        required: true,
      },

      /*
       * Person to whom the relationship points.
       *
       * For parent:
       * toMember is the child.
       */
      toMember: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Member",
        required: true,
      },

      /*
       * Canonical relationship type.
       *
       * Father, mother, son and daughter are derived
       * from parent direction and gender.
       */
      relationshipType: {
        type: String,
        enum: [
          "parent",
          "spouse",
          "sibling",
          "guardian",
        ],
        required: [
          true,
          "Relationship type is required",
        ],
      },

      /*
       * Important for hereditary analysis.
       */
      relationshipNature: {
        type: String,
        enum: [
          "biological",
          "adoptive",
          "step",
          "marital",
          "guardian",
          "unknown",
        ],
        default: "unknown",
      },

      notes: {
        type: String,
        trim: true,
        maxlength: [
          500,
          "Relationship notes cannot exceed 500 characters",
        ],
        default: "",
      },

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      status: {
        type: String,
        enum: [
          "active",
          "removed",
        ],
        default: "active",
      },
    },
    {
      timestamps: true,
    },
  );

/* =========================================================
   PREVENT SELF-RELATIONSHIP
   ========================================================= */

relationshipSchema.pre(
  "validate",
  function () {
    if (
      this.fromMember &&
      this.toMember &&
      String(this.fromMember) ===
        String(this.toMember)
    ) {
      this.invalidate(
        "toMember",
        "A person cannot have a relationship with themselves",
      );
    }
  },
);

/* =========================================================
   PREVENT EXACT DUPLICATE RELATIONSHIPS
   ========================================================= */

relationshipSchema.index(
  {
    familyId: 1,
    fromMember: 1,
    toMember: 1,
    relationshipType: 1,
  },
  {
    unique: true,
  },
);

/* =========================================================
   FAMILY TREE QUERY INDEXES
   ========================================================= */

relationshipSchema.index({
  familyId: 1,
  fromMember: 1,
  status: 1,
});

relationshipSchema.index({
  familyId: 1,
  toMember: 1,
  status: 1,
});

/* =========================================================
   EXPORT
   ========================================================= */

module.exports =
  mongoose.model(
    "Relationship",
    relationshipSchema,
  );