const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/* =========================================================
   CALCULATE CURRENT AGE
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
   USER SCHEMA
   ========================================================= */

const userSchema =
  new mongoose.Schema(
    {
      fullName: {
        type: String,
        required: [
          true,
          "Full name is required",
        ],
        trim: true,
      },

      email: {
        type: String,
        required: [
          true,
          "Email is required",
        ],
        unique: true,
        lowercase: true,
        trim: true,
      },

      phone: {
        type: String,
        trim: true,
        default: "",
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

      /*
       * Current Family workspace.
       */
      familyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Family",
        default: null,
        index: true,
      },

      /*
       * Optional FamilyMember profile representing
       * this logged-in user inside the family tree.
       */
      memberProfileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Member",
        default: null,
      },

      /*
       * Automatically assigned from current age.
       */
      role: {
        type: String,
        enum: [
          "health_manager",
          "viewer",
        ],
        default: "viewer",
      },

      password: {
        type: String,
        required: [
          true,
          "Password is required",
        ],
        minlength: 6,
        select: false,
      },
    },
    {
      timestamps: true,
    },
  );

/* =========================================================
   ASSIGN ROLE AND HASH PASSWORD
   ========================================================= */

userSchema.pre(
  "save",
  async function () {
    if (
      this.isNew ||
      this.isModified("dateOfBirth")
    ) {
      const currentAge =
        calculateAge(
          this.dateOfBirth,
        );

      this.role =
        currentAge > 21
          ? "health_manager"
          : "viewer";
    }

    if (
      !this.isModified("password")
    ) {
      return;
    }

    const salt =
      await bcrypt.genSalt(10);

    this.password =
      await bcrypt.hash(
        this.password,
        salt,
      );
  },
);

/* =========================================================
   USER METHODS
   ========================================================= */

userSchema.methods.calculateAge =
  function () {
    return calculateAge(
      this.dateOfBirth,
    );
  };

userSchema.methods.canModifyInformation =
  function () {
    return this.calculateAge() > 21;
  };

userSchema.methods.synchronizeRole =
  async function () {
    const correctRole =
      this.canModifyInformation()
        ? "health_manager"
        : "viewer";

    if (this.role !== correctRole) {
      this.role = correctRole;
      await this.save();
    }

    return this.role;
  };

userSchema.methods.comparePassword =
  async function (enteredPassword) {
    return bcrypt.compare(
      enteredPassword,
      this.password,
    );
  };

/* =========================================================
   SAFE USER RESPONSE
   ========================================================= */

userSchema.methods.toSafeObject =
  function () {
    const age =
      this.calculateAge();

    return {
      _id: this._id,
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      dateOfBirth:
        this.dateOfBirth,

      familyId:
        this.familyId,

      memberProfileId:
        this.memberProfileId,

      age,
      role: this.role,

      canModifyInformation:
        age > 21,

      createdAt:
        this.createdAt,

      updatedAt:
        this.updatedAt,
    };
  };

/* =========================================================
   EXPORT
   ========================================================= */

const User = mongoose.model(
  "User",
  userSchema,
);

module.exports = User;
module.exports.calculateAge =
  calculateAge;