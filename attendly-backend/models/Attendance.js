const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    // YYYY-MM-DD string for fast daily lookups without timezone issues
    date_key: {
      type: String,
      required: true,
    },
    clock_in: {
      type: Date,
      default: null,
    },
    clock_out: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["present", "late", "absent", "on_leave", "holiday"],
      required: true,
    },
    overridden_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    override_note: {
      type: String,
      default: null,
    },
    auto_clocked_out: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// One record per user per day
attendanceSchema.index(
  { user_id: 1, company_id: 1, date_key: 1 },
  { unique: true },
);
attendanceSchema.index({ company_id: 1, date_key: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
