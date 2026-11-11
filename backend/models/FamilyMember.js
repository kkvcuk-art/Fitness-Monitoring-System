const mongoose = require("mongoose");

const familyMemberSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },

        dateOfBirth: {
            type: Date
        },

        age: {
            type: Number,
            min: 0
        },

        gender: {
            type: String,
            enum: ["Male", "Female", "Other"]
        },

        relationship: {
            type: String,
            required: true,
            trim: true
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
                "O-"
            ]
        },

        phone: {
            type: String,
            trim: true
        },

        email: {
            type: String,
            trim: true,
            lowercase: true
        },

        address: {
            type: String,
            trim: true
        },

        /* Basic health information */

        height: {
            type: Number
        },

        weight: {
            type: Number
        },

        bloodPressure: {
            type: String,
            trim: true
        },

        bloodSugar: {
            type: Number
        },

        /* Health history */

        allergies: {
            type: String,
            trim: true
        },

        diseases: {
            type: String,
            trim: true
        },

        medicalHistory: {
            type: String,
            trim: true
        },

        familyDiseases: {
            type: String,
            trim: true
        },

        healthNotes: {
            type: String,
            trim: true
        },

        status: {
            type: String,
            default: "Good"
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.model(
        "FamilyMember",
        familyMemberSchema
    );