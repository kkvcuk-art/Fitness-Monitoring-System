const express = require("express");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Family = require("../models/Family");
const Member = require("../models/Member");
const {
  ensureFamilyWorkspace,
} = require("../services/familyWorkspaceService");

const router = express.Router();

/* =========================================================
   JWT
   ========================================================= */

function generateToken(userId) {
  return jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
}

/* =========================================================
   REGISTER
   POST /api/auth/register
   ========================================================= */

router.post(
  "/register",
  async (req, res) => {
    let createdUser = null;
    let createdFamily = null;
    let createdMember = null;

    try {
      const {
        fullName,
        email,
        phone,
        dateOfBirth,
        password,
      } = req.body;

      if (
        !fullName ||
        !email ||
        !dateOfBirth ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Full name, email, date of birth and password are required",
        });
      }

      if (
        String(password).length < 6
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password must contain at least 6 characters",
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

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
        });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists",
        });
      }

      /*
       * User model calculates age and role.
       */
      createdUser =
        await User.create({
          fullName:
            String(fullName).trim(),

          email:
            normalizedEmail,

          phone:
            phone
              ? String(phone).trim()
              : "",

          dateOfBirth:
            parsedDateOfBirth,

          password,
        });

      /*
       * Only an adult Health Manager creates
       * a new family workspace.
       */
      if (
        createdUser.role ===
        "health_manager"
      ) {
        const firstName =
          createdUser.fullName
            .split(/\s+/)[0];

        createdFamily =
          await Family.create({
            familyName:
              `${firstName}'s Family`,

            createdBy:
              createdUser._id,

            users: [
              {
                user:
                  createdUser._id,

                status:
                  "active",
              },
            ],
          });

        /*
         * Create the account owner's profile
         * inside the family tree.
         */
        createdMember =
          await Member.create({
            familyId:
              createdFamily._id,

            createdBy:
              createdUser._id,

            linkedUser:
              createdUser._id,

            fullName:
              createdUser.fullName,

            dateOfBirth:
              createdUser.dateOfBirth,

            gender:
              "Not specified",

            bloodGroup:
              "Unknown",

            phone:
              createdUser.phone,

            email:
              createdUser.email,

            healthStatus:
              "Unknown",
          });

        createdUser.familyId =
          createdFamily._id;

        createdUser.memberProfileId =
          createdMember._id;

        await createdUser.save();
      }

      const token =
        generateToken(
          createdUser._id,
        );

      const isManager =
        createdUser.role ===
        "health_manager";

      return res.status(201).json({
        success: true,

        message: isManager
          ? "Account and family workspace created successfully"
          : "Viewer account created. Join an existing family using an invite code.",

        token,
        user:
          createdUser.toSafeObject(),

        family: createdFamily
          ? {
              _id:
                createdFamily._id,

              familyName:
                createdFamily.familyName,

              inviteCode:
                createdFamily.inviteCode,
            }
          : null,

        memberProfile:
          createdMember || null,
      });
    } catch (error) {
      console.error(
        "Register error:",
        error,
      );

      /*
       * Remove incomplete registration data.
       */
      if (createdMember?._id) {
        await Member.findByIdAndDelete(
          createdMember._id,
        ).catch(() => {});
      }

      if (createdFamily?._id) {
        await Family.findByIdAndDelete(
          createdFamily._id,
        ).catch(() => {});
      }

      if (createdUser?._id) {
        await User.findByIdAndDelete(
          createdUser._id,
        ).catch(() => {});
      }

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists",
        });
      }

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
          "Server error while creating account",
      });
    }
  },
);

/* =========================================================
   LOGIN
   POST /api/auth/login
   ========================================================= */

router.post(
  "/login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message:
            "Email and password are required",
        });
      }

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      const user =
        await User.findOne({
          email: normalizedEmail,
        }).select("+password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password",
        });
      }

      const passwordMatches =
        await user.comparePassword(
          password,
        );

      if (!passwordMatches) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password",
        });
      }

      await user.synchronizeRole();
      await ensureFamilyWorkspace(user);

      const token =
        generateToken(user._id);

      return res.status(200).json({
        success: true,
        message:
          "Login successful",
        token,
        user:
          user.toSafeObject(),
      });
    } catch (error) {
      console.error(
        "Login error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while logging in",
      });
    }
  },
);

module.exports = router;