const jwt = require("jsonwebtoken");

const User = require("../models/User");

/* =========================================================
   AUTHENTICATE USER
   ========================================================= */

const protect = async (req, res, next) => {
  try {
    const authHeader =
      req.headers.authorization;

    let token = null;

    if (
      authHeader &&
      authHeader.startsWith("Bearer ")
    ) {
      token =
        authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required. Please login.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
    );

    const user = await User.findById(
      decoded.userId,
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "User associated with this token no longer exists.",
      });
    }

    /*
     * Recalculate role in case the user has crossed
     * the age boundary since the previous login.
     */
    await user.synchronizeRole();

    req.user = user;

    next();
  } catch (error) {
    console.error(
      "Authentication middleware error:",
      error,
    );

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message:
          "Your session has expired. Please login again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Authentication verification failed.",
    });
  }
};

/* =========================================================
   HEALTH MANAGER AUTHORIZATION
   Age must be greater than 21
   ========================================================= */

const healthManagerOnly = (
  req,
  res,
  next,
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message:
        "Authentication required. Please login.",
    });
  }

  const currentAge =
    req.user.calculateAge();

  const isHealthManager =
    req.user.role === "health_manager" &&
    currentAge > 21;

  if (!isHealthManager) {
    return res.status(403).json({
      success: false,

      message:
        "View-only access: You must be older than 21 to change health information.",

      permission: {
        role: req.user.role,
        age: currentAge,
        canModifyInformation: false,
      },
    });
  }

  next();
};

/* =========================================================
   EXPORT
   ========================================================= */

module.exports = {
  protect,
  healthManagerOnly,
};