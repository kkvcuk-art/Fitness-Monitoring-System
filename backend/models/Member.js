const mongoose = require("mongoose");

/* =========================================================
   CALCULATE AGE FROM DATE OF BIRTH
   ========================================================= */

function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  let age =
    today.getUTCFullYear() -
    birthDate.getUTCFullYear();

  const currentMonth =
    today.getUTCMonth();

  const birthMonth =
    birthDate.getUTCMonth();

  const birthdayHasNotOccurred =
    currentMonth < birthMonth ||
    (
      currentMonth === birthMonth &&
      today.getUTCDate() <
        birthDate.getUTCDate()
    );

  if (birthdayHasNotOccurred) {
    age -= 1;
  }

  return age;
}

/* =========================================================
   FAMILY MEMBER SCHEMA
   ========================================================= */

const memberSchema =
  new mongoose.Schema(
    {
      /*
       * Family workspace containing this profile.
       */
      familyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Family",
        required: [
          true,
          "Family workspace is required",
        ],
        index: true,
      },

      /*
       * User who originally created this profile.
       */
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [
          true,
          "Profile creator is required",
        ],
        index: true,
      },

      /*
       * Optional login account belonging to this person.
       *
       * Ordinary family profiles do not contain
       * this field at all.
       */
      linkedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      fullName: {
        type: String,
        required: [
          true,
          "Full name is required",
        ],
        trim: true,
      },

      dateOfBirth: {
        type: Date,
        required: [
          true,
          "Date of birth is required",
        ],

        validate: {
          validator(value) {
            return (
              value instanceof Date &&
              !Number.isNaN(
                value.getTime(),
              ) &&
              value <= new Date()
            );
          },

          message:
            "Date of birth must be a valid past date",
        },
      },

      gender: {
        type: String,
        enum: [
          "Male",
          "Female",
          "Other",
          "Not specified",
        ],
        default: "Not specified",
      },

      bloodGroup: {
        type: String,
        enum: [
          "A+",
          "A-",
          "B+",
          "B-",
          "AB+",
          "AB-",
          "O+",
          "O-",
          "Unknown",
        ],
        default: "Unknown",
      },

      phone: {
        type: String,
        trim: true,
        default: "",
      },

      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: "",
      },

      emergencyContactName: {
        type: String,
        trim: true,
        default: "",
      },

      emergencyContactPhone: {
        type: String,
        trim: true,
        default: "",
      },

      allergies: {
        type: String,
        trim: true,
        default: "",
      },

      previousDiseases: {
        type: String,
        trim: true,
        default: "",
      },

      surgeryHistory: {
        type: String,
        trim: true,
        default: "",
      },

      vaccinationHistory: {
        type: String,
        trim: true,
        default: "",
      },

      additionalHealthNotes: {
        type: String,
        trim: true,
        default: "",
      },

      /* Physiological Vitals */
      weightKg: {
        type: Number,
        default: 68,
      },

      heightCm: {
        type: Number,
        default: 168,
      },

      systolicBp: {
        type: Number,
        default: 120,
      },

      diastolicBp: {
        type: Number,
        default: 80,
      },

      fastingGlucose: {
        type: Number,
        default: 95,
      },

      cholesterol: {
        type: Number,
        default: 190,
      },

      sleepHours: {
        type: Number,
        default: 7.0,
      },

      activityMinutes: {
        type: Number,
        default: 30,
      },

      healthStatus: {
        type: String,
        enum: [
          "Good",
          "Needs Attention",
          "Critical",
          "Unknown",
        ],
        default: "Unknown",
      },

      generation: {
        type: String,
        enum: [
          "Grandparent",
          "Parent",
          "Child",
          "Other",
        ],
        default: "Parent",
      },

      isLiving: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,

      toJSON: {
        virtuals: true,
      },

      toObject: {
        virtuals: true,
      },
    },
  );

/* =========================================================
   VIRTUAL CURRENT AGE
   Age is calculated from DOB, not stored.
   ========================================================= */

memberSchema.virtual("age").get(
  function () {
    return calculateAge(
      this.dateOfBirth,
    );
  },
);

memberSchema.virtual("bmi").get(
  function () {
    if (!this.weightKg || !this.heightCm) return 24.0;
    const heightM = this.heightCm / 100;
    const bmiVal = this.weightKg / (heightM * heightM);
    return Math.round(bmiVal * 10) / 10;
  },
);

/* =========================================================
   DATABASE INDEXES
   ========================================================= */

memberSchema.index({
  familyId: 1,
  createdAt: -1,
});

memberSchema.index({
  familyId: 1,
  fullName: 1,
});

/*
 * Only documents containing a real linkedUser ObjectId
 * are included in this unique index.
 *
 * Ordinary members without login accounts are excluded.
 */
memberSchema.index(
  {
    linkedUser: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      linkedUser: {
        $type: "objectId",
      },
    },
  },
);

/* =========================================================
   EXPORT
   ========================================================= */

const Member =
  mongoose.model(
    "Member",
    memberSchema,
  );

module.exports = Member;

module.exports.calculateAge =
  calculateAge;