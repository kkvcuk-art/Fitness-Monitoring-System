const crypto = require("crypto");
const mongoose = require("mongoose");

/* =========================================================
   FAMILY USER MEMBERSHIP SCHEMA
   ========================================================= */

const familyUserSchema =
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      joinedAt: {
        type: Date,
        default: Date.now,
      },

      status: {
        type: String,
        enum: [
          "active",
          "pending",
          "removed",
        ],
        default: "active",
      },
    },
    {
      _id: false,
    },
  );

/* =========================================================
   FAMILY WORKSPACE SCHEMA
   ========================================================= */

const familySchema =
  new mongoose.Schema(
    {
      familyName: {
        type: String,
        required: [
          true,
          "Family name is required",
        ],
        trim: true,
        maxlength: [
          100,
          "Family name cannot exceed 100 characters",
        ],
      },

      /*
       * User who originally created the family workspace.
       */
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      /*
       * Users who have login access to this family.
       *
       * Their health_manager/viewer role still comes
       * from the User model and current age.
       */
      users: {
        type: [familyUserSchema],
        default: [],
      },

      /*
       * Can be shared later to invite another user.
       */
      inviteCode: {
        type: String,
        unique: true,
        uppercase: true,
        trim: true,
        index: true,
      },

      status: {
        type: String,
        enum: [
          "active",
          "archived",
        ],
        default: "active",
      },
    },
    {
      timestamps: true,
    },
  );

/* =========================================================
   CREATE UNIQUE-STYLE INVITE CODE
   ========================================================= */

familySchema.pre(
  "validate",
  function () {
    if (!this.inviteCode) {
      this.inviteCode =
        crypto
          .randomBytes(4)
          .toString("hex")
          .toUpperCase();
    }
  },
);

/* =========================================================
   CHECK WHETHER USER BELONGS TO FAMILY
   ========================================================= */

familySchema.methods.hasUser =
  function (userId) {
    return this.users.some(
      (membership) =>
        membership.status === "active" &&
        String(membership.user) ===
          String(userId),
    );
  };

/* =========================================================
   ADD USER TO FAMILY
   ========================================================= */

familySchema.methods.addUser =
  async function (userId) {
    const existingMembership =
      this.users.find(
        (membership) =>
          String(membership.user) ===
          String(userId),
      );

    if (existingMembership) {
      existingMembership.status =
        "active";
    } else {
      this.users.push({
        user: userId,
        status: "active",
      });
    }

    return this.save();
  };

/* =========================================================
   INDEXES
   ========================================================= */

familySchema.index({
  "users.user": 1,
  status: 1,
});

/* =========================================================
   EXPORT
   ========================================================= */

module.exports =
  mongoose.model(
    "Family",
    familySchema,
  );