const FamilyMember = require("../models/FamilyMember");

// @desc    Get all family members
// @route   GET /api/members
const getMembers = async (req, res) => {
    try {
        const members = await FamilyMember.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: members.length,
            data: members
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch family members",
            error: error.message
        });
    }
};


// @desc    Get single family member
// @route   GET /api/members/:id
const getMember = async (req, res) => {
    try {
        const member = await FamilyMember.findById(req.params.id);

        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Family member not found"
            });
        }

        res.status(200).json({
            success: true,
            data: member
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch family member",
            error: error.message
        });
    }
};


// @desc    Add a family member
// @route   POST /api/members
const createMember = async (req, res) => {
    try {
        const member = await FamilyMember.create(req.body);

        res.status(201).json({
            success: true,
            message: "Family member added successfully",
            data: member
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to add family member",
            error: error.message
        });
    }
};


// @desc    Update family member
// @route   PUT /api/members/:id
const updateMember = async (req, res) => {
    try {
        const member = await FamilyMember.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Family member not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Family member updated successfully",
            data: member
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to update family member",
            error: error.message
        });
    }
};


// @desc    Delete family member
// @route   DELETE /api/members/:id
const deleteMember = async (req, res) => {
    try {
        const member = await FamilyMember.findByIdAndDelete(req.params.id);

        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Family member not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Family member deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete family member",
            error: error.message
        });
    }
};


module.exports = {
    getMembers,
    getMember,
    createMember,
    updateMember,
    deleteMember
};