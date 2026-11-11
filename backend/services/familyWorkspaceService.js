const Family =
  require("../models/Family");

const Member =
  require("../models/Member");

/* =========================================================
   MIGRATE OLD ADULT ACCOUNT TO FAMILY WORKSPACE
   ========================================================= */

async function ensureFamilyWorkspace(
  user,
) {
  /*
   * Only Health Managers can automatically
   * create a new family workspace.
   */
  if (
    user.role !== "health_manager"
  ) {
    return {
      family: null,
      memberProfile: null,
    };
  }

  let family = null;

  /*
   * First check familyId stored in User.
   */
  if (user.familyId) {
    family =
      await Family.findById(
        user.familyId,
      );
  }

  /*
   * If familyId is missing, search for a family
   * previously created by this user.
   */
  if (!family) {
    family =
      await Family.findOne({
        status: "active",

        $or: [
          {
            createdBy:
              user._id,
          },

          {
            "users.user":
              user._id,
          },
        ],
      });
  }

  /*
   * Old account has no family:
   * create a new Family workspace.
   */
  if (!family) {
    const firstName =
      user.fullName
        .trim()
        .split(/\s+/)[0];

    family =
      await Family.create({
        familyName:
          `${firstName}'s Family`,

        createdBy:
          user._id,

        users: [
          {
            user:
              user._id,

            status:
              "active",
          },
        ],
      });
  } else if (
    !family.hasUser(user._id)
  ) {
    /*
     * Ensure user is included in Family.users.
     */
    await family.addUser(
      user._id,
    );
  }

  let memberProfile = null;

  /*
   * Check memberProfileId stored in User.
   */
  if (user.memberProfileId) {
    memberProfile =
      await Member.findOne({
        _id:
          user.memberProfileId,

        familyId:
          family._id,
      });
  }

  /*
   * Search for an existing profile linked to User.
   */
  if (!memberProfile) {
    memberProfile =
      await Member.findOne({
        linkedUser:
          user._id,

        familyId:
          family._id,
      });
  }

  /*
   * Create self-profile when none exists.
   */
  if (!memberProfile) {
    memberProfile =
      await Member.create({
        familyId:
          family._id,

        createdBy:
          user._id,

        linkedUser:
          user._id,

        fullName:
          user.fullName,

        dateOfBirth:
          user.dateOfBirth,

        gender:
          "Not specified",

        bloodGroup:
          "Unknown",

        phone:
          user.phone || "",

        email:
          user.email,

        healthStatus:
          "Unknown",
      });
  }

  /*
   * Save Family and Member references in User.
   */
  user.familyId =
    family._id;

  user.memberProfileId =
    memberProfile._id;

  await user.save();

  return {
    family,
    memberProfile,
  };
}

module.exports = {
  ensureFamilyWorkspace,
};