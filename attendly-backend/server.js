require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

//  Routes
const authRoutes = require("./routes/auth");
const attendanceRoutes = require("./routes/attendance");
const leaveRoutes = require("./routes/leave");
const adminRoutes = require("./routes/admin");
const deductionRoutes = require("./routes/deductions");
const profileRoutes = require("./routes/profile");
const notificationRoutes = require("./routes/notification");
const searchRoutes = require("./routes/search");

//  Cron jobs
const {
  startAbsentCron,
  startMonthlyDeductionCron,
  startAutoClockOutCron,
} = require("./jobs/attendanceCron");

const app = express();
const PORT = process.env.PORT || 5000;

//  Middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//  Health check
app.get("/health", (_, res) => res.json({ status: "ok", app: "Attendly API" }));

//  API routes
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/deductions", deductionRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);

//  404 handler
app.use((req, res) =>
  res.status(404).json({ success: false, message: "Route not found" }),
);

//  Global error handler
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.message);
  res.status(500).json({ success: false, message: "Internal server error" });
});

//  Start
connectDB().then(async () => {
  app.listen(PORT, () => {
    console.log(` Attendly API running on port ${PORT}`);

    // Start cron jobs after DB is connected
    startAbsentCron();
    startMonthlyDeductionCron();
    startAutoClockOutCron();
    console.log("Cron jobs scheduled (WAT timezone)");
  });
});
