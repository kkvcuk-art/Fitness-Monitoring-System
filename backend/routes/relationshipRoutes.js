const express = require("express");
const mongoose = require("mongoose");

const Member =
  require("../models/Member");

const Relationship =
  require("../models/Relationship");

const {
  protect,
  healthManagerOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

/* =========================================================
   REQUIRE FAMILY
   ========================================================= */

function requireFamily(
  req,
  res,
  next,
) {
  if (!req.user.familyId) {
    return res.status(403).json({
      success: false,
      message:
        "Your account is not connected to a family workspace.",
    });
  }

  next();
}

router.use(requireFamily);

/* =========================================================
   CHECK BOTH MEMBERS BELONG TO CURRENT FAMILY
   ========================================================= */

async function membersBelongToFamily(
  memberIds,
  familyId,
) {
  const uniqueIds = [
    ...new Set(
      memberIds.map(String),
    ),
  ];

  if (uniqueIds.length !== 2) {
    return false;
  }

  const count =
    await Member.countDocuments({
      _id: {
        $in: uniqueIds,
      },

      familyId,
    });

  return count === 2;
}

/* =========================================================
   PREVENT PARENT RELATIONSHIP CYCLES
   ========================================================= */

async function createsParentCycle(
  familyId,
  parentId,
  childId,
) {
  const relationships =
    await Relationship.find({
      familyId,
      relationshipType: "parent",
      status: "active",
    }).select(
      "fromMember toMember",
    );

  const childrenByParent =
    new Map();

  relationships.forEach(
    (relationship) => {
      const parent =
        String(
          relationship.fromMember,
        );

      const child =
        String(
          relationship.toMember,
        );

      if (
        !childrenByParent.has(parent)
      ) {
        childrenByParent.set(
          parent,
          [],
        );
      }

      childrenByParent
        .get(parent)
        .push(child);
    },
  );

  /*
   * Adding parent -> child creates a cycle
   * if child already leads back to parent.
   */
  const target =
    String(parentId);

  const queue = [
    String(childId),
  ];

  const visited =
    new Set();

  while (queue.length > 0) {
    const current =
      queue.shift();

    if (current === target) {
      return true;
    }

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    const children =
      childrenByParent.get(
        current,
      ) || [];

    queue.push(...children);
  }

  return false;
}

/* =========================================================
   GET FAMILY RELATIONSHIPS
   GET /api/relationships
   ========================================================= */

router.get("/", async (req, res) => {
  try {
    const relationships =
      await Relationship.find({
        familyId:
          req.user.familyId,

        status:
          "active",
      })
        .populate(
          "fromMember",
          "fullName dateOfBirth gender bloodGroup healthStatus isLiving",
        )
        .populate(
          "toMember",
          "fullName dateOfBirth gender bloodGroup healthStatus isLiving",
        )
        .sort({
          createdAt: 1,
        });

    return res.status(200).json({
      success: true,
      count:
        relationships.length,
      data:
        relationships,
    });
  } catch (error) {
    console.error(
      "Get relationships error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load family relationships.",
    });
  }
});

/* =========================================================
   CREATE RELATIONSHIP
   POST /api/relationships
   Health Manager only
   ========================================================= */

router.post(
  "/",
  healthManagerOnly,
  async (req, res) => {
    try {
      const {
        fromMember,
        toMember,
        relationshipType,
        relationshipNature,
        notes,
      } = req.body;

      if (
        !fromMember ||
        !toMember ||
        !relationshipType
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Both family members and relationship type are required.",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          fromMember,
        ) ||
        !mongoose.Types.ObjectId.isValid(
          toMember,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid family member ID.",
        });
      }

      if (
        String(fromMember) ===
        String(toMember)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A person cannot have a relationship with themselves.",
        });
      }

      const allowedTypes = [
        "parent",
        "spouse",
        "sibling",
        "guardian",
      ];

      if (
        !allowedTypes.includes(
          relationshipType,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid relationship type.",
        });
      }

      const membersAreValid =
        await membersBelongToFamily(
          [
            fromMember,
            toMember,
          ],

          req.user.familyId,
        );

      if (!membersAreValid) {
        return res.status(404).json({
          success: false,
          message:
            "One or both family members were not found in your family.",
        });
      }

      /*
       * Spouse and sibling relationships are symmetric.
       * Check both possible directions.
       */
      const symmetricRelationship =
        relationshipType === "spouse" ||
        relationshipType === "sibling";

      const duplicateQuery =
        symmetricRelationship
          ? {
              familyId:
                req.user.familyId,

              relationshipType,

              status:
                "active",

              $or: [
                {
                  fromMember,
                  toMember,
                },

                {
                  fromMember:
                    toMember,

                  toMember:
                    fromMember,
                },
              ],
            }
          : {
              familyId:
                req.user.familyId,

              fromMember,
              toMember,
              relationshipType,

              status:
                "active",
            };

      const existingRelationship =
        await Relationship.findOne(
          duplicateQuery,
        );

      if (existingRelationship) {
        return res.status(409).json({
          success: false,
          message:
            "This family relationship already exists.",
        });
      }

      if (
        relationshipType ===
        "parent"
      ) {
        const cycleExists =
          await createsParentCycle(
            req.user.familyId,
            fromMember,
            toMember,
          );

        if (cycleExists) {
          return res.status(400).json({
            success: false,
            message:
              "This parent relationship would create an invalid family-tree cycle.",
          });
        }
      }

      let finalNature =
        relationshipNature ||
        "unknown";

      if (
        relationshipType ===
        "spouse"
      ) {
        finalNature = "marital";
      }

      if (
        relationshipType ===
        "guardian"
      ) {
        finalNature = "guardian";
      }

      let relationship =
        await Relationship.create({
          familyId:
            req.user.familyId,

          fromMember,
          toMember,
          relationshipType,

          relationshipNature:
            finalNature,

          notes:
            notes || "",

          createdBy:
            req.user._id,
        });

      relationship =
        await relationship.populate([
          {
            path:
              "fromMember",

            select:
              "fullName dateOfBirth gender bloodGroup healthStatus isLiving",
          },

          {
            path:
              "toMember",

            select:
              "fullName dateOfBirth gender bloodGroup healthStatus isLiving",
          },
        ]);

      return res.status(201).json({
        success: true,
        message:
          "Family relationship added successfully.",
        data:
          relationship,
      });
    } catch (error) {
      console.error(
        "Create relationship error:",
        error,
      );

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "This family relationship already exists.",
        });
      }

      if (
        error.name ===
        "ValidationError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to add family relationship.",
      });
    }
  },
);

/* =========================================================
   UPDATE RELATIONSHIP DETAILS
   PUT /api/relationships/:id
   Health Manager only
   ========================================================= */

router.put(
  "/:id",
  healthManagerOnly,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid relationship ID.",
        });
      }

      const updateData = {};

      if (
        req.body.relationshipNature !==
        undefined
      ) {
        updateData.relationshipNature =
          req.body.relationshipNature;
      }

      if (
        req.body.notes !== undefined
      ) {
        updateData.notes =
          req.body.notes;
      }

      const relationship =
        await Relationship.findOneAndUpdate(
          {
            _id: id,

            familyId:
              req.user.familyId,

            status:
              "active",
          },

          updateData,

          {
            new: true,
            runValidators: true,
          },
        )
          .populate(
            "fromMember",
            "fullName dateOfBirth gender",
          )
          .populate(
            "toMember",
            "fullName dateOfBirth gender",
          );

      if (!relationship) {
        return res.status(404).json({
          success: false,
          message:
            "Family relationship not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Family relationship updated successfully.",
        data:
          relationship,
      });
    } catch (error) {
      console.error(
        "Update relationship error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update family relationship.",
      });
    }
  },
);

/* =========================================================
   DELETE RELATIONSHIP
   DELETE /api/relationships/:id
   Health Manager only
   ========================================================= */

router.delete(
  "/:id",
  healthManagerOnly,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid relationship ID.",
        });
      }

      const relationship =
        await Relationship.findOneAndDelete({
          _id: id,

          familyId:
            req.user.familyId,
        });

      if (!relationship) {
        return res.status(404).json({
          success: false,
          message:
            "Family relationship not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Family relationship removed successfully.",
      });
    } catch (error) {
      console.error(
        "Delete relationship error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to remove family relationship.",
      });
    }
  },
);

module.exports = router;