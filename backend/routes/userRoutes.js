const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const User = require("../models/User");


// =========================================================
// GET USER PROFILE
// GET /api/users/:id
// =========================================================

router.get("/:id", async (req, res) => {

    try {

        const { id } = req.params;


        if (!mongoose.Types.ObjectId.isValid(id)) {

            return res.status(400).json({
                success: false,
                message: "Invalid user ID."
            });

        }


        const user =
            await User.findById(id)
                .select("-password");


        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });

        }


        res.status(200).json({
            success: true,
            data: user
        });

    }

    catch (error) {

        console.error(
            "Get user profile error:",
            error
        );


        res.status(500).json({
            success: false,
            message:
                "Unable to load user profile."
        });

    }

});


// =========================================================
// UPDATE USER PROFILE
// PUT /api/users/:id
// =========================================================

router.put("/:id", async (req, res) => {

    try {

        const { id } = req.params;


        if (!mongoose.Types.ObjectId.isValid(id)) {

            return res.status(400).json({
                success: false,
                message: "Invalid user ID."
            });

        }


        const {
            firstName,
            lastName,
            email,
            phone,
            dateOfBirth,
            gender,
            address
        } = req.body;


        if (!email) {

            return res.status(400).json({
                success: false,
                message:
                    "Email address is required."
            });

        }


        // Check duplicate email

        const existingUser =
            await User.findOne({
                email:
                    email.trim().toLowerCase(),

                _id: {
                    $ne: id
                }
            });


        if (existingUser) {

            return res.status(409).json({
                success: false,
                message:
                    "This email address is already being used."
            });

        }


        const fullName =
            `${firstName || ""} ${lastName || ""}`
                .trim();


        const updatedUser =
            await User.findByIdAndUpdate(
                id,
                {
                    firstName:
                        firstName || "",

                    lastName:
                        lastName || "",

                    fullName,

                    email:
                        email.trim().toLowerCase(),

                    phone:
                        phone || "",

                    dateOfBirth:
                        dateOfBirth || null,

                    gender:
                        gender || "",

                    address:
                        address || ""
                },
                {
                    new: true,
                    runValidators: true
                }
            )
            .select("-password");


        if (!updatedUser) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });

        }


        res.status(200).json({

            success: true,

            message:
                "Profile updated successfully.",

            data:
                updatedUser

        });

    }

    catch (error) {

        console.error(
            "Update profile error:",
            error
        );


        if (error.code === 11000) {

            return res.status(409).json({
                success: false,
                message:
                    "This email address is already registered."
            });

        }


        res.status(500).json({
            success: false,
            message:
                "Unable to update profile."
        });

    }

});


module.exports = router;