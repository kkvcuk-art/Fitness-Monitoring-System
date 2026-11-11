const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const app = express();

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

const authRoutes = require("./routes/authRoutes");
const memberRoutes = require("./routes/memberRoutes");
const relationshipRoutes = require("./routes/relationshipRoutes");
const vaccinationRoutes = require("./routes/vaccinationRoutes");
const medicalReportRoutes = require("./routes/medicalReportRoutes");
const aiRoutes = require("./routes/aiRoutes");
const disasterRoutes = require("./routes/disasterRoutes");
const vitalRoutes = require("./routes/vitalRoutes");
const baselineRoutes = require("./routes/baselineRoutes");
const anomalyRoutes = require("./routes/anomalyRoutes");
const environmentRoutes = require("./routes/environmentRoutes");
const environmentRiskRoutes = require("./routes/environmentRiskRoutes");

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use("/api/auth", authRoutes);

app.use("/api/members", memberRoutes);

app.use(
  "/api/relationships",
  relationshipRoutes
);

app.use(
  "/api/vaccinations",
  vaccinationRoutes
);

app.use(
  "/api/medical-reports",
  medicalReportRoutes
);

app.use("/api/ai", aiRoutes);

app.use("/api/disaster", disasterRoutes);

app.use("/api/vitals", vitalRoutes);

app.use("/api/baseline", baselineRoutes);

app.use("/api/anomalies", anomalyRoutes);

app.use(
  "/api/environment",
  environmentRoutes
);

app.use(
  "/api/environment-risk",
  environmentRiskRoutes
);

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "Family Health Monitoring System backend is running",
    timestamp: new Date().toISOString(),
  });
});

/*
|--------------------------------------------------------------------------
| Root Route
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.status(200).json({
    message:
      "Family Health Monitoring System API",
    status: "running",
  });
});

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message:
      err.message ||
      "Internal server error",
  });
});

/*
|--------------------------------------------------------------------------
| Server Configuration
|--------------------------------------------------------------------------
*/

const PORT =
  process.env.PORT || 5000;

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/family-health-monitoring";

/*
|--------------------------------------------------------------------------
| MongoDB Connection
|--------------------------------------------------------------------------
*/

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(
      "MongoDB connected successfully"
    );

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );

      console.log(
        `Health check: http://localhost:${PORT}/api/health`
      );
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error.message
    );

    process.exit(1);
  });