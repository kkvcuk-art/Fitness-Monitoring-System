const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const { getEnvironmentalData } = require("../services/environmentService");

const router = express.Router();

/*
 * All environment routes require authentication.
 */
router.use(protect);

/*
 * GET /api/environment/current
 *
 * Example:
 * /api/environment/current?latitude=15.36&longitude=75.12
 */
router.get("/current", async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Latitude and longitude are required.",
      });
    }

    const environmentData =
      await getEnvironmentalData(
        latitude,
        longitude
      );

    return res.status(200).json(
      environmentData
    );
  } catch (error) {
    console.error(
      "Environment data error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve environmental data.",
      error: error.message,
    });
  }
});

module.exports = router;