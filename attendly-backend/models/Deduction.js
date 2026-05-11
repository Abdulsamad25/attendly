const mongoose = require("mongoose");

const deductionSchema = new mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Period
    month: { type: Number, required: true }, // 1–12
    year: { type: Number, required: true },

    // Snapshot of salary at time of calculation
    monthly_salary: { type: Number, required: true },
    daily_rate: { type: Number, required: true },

    // Absence data
    absent_days: { type: Number, default: 0 },
    absent_amount: { type: Number, default: 0 },

    // Late data
    late_count: { type: Number, default: 0 },
    late_units: { type: Number, default: 0 }, // how many groups of 5 lates
    late_amount: { type: Number, default: 0 },

    // Total
    total_deduction: { type: Number, default: 0 },

    // Audit
    last_updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

// One deduction record per user per month per year
deductionSchema.index({ user_id: 1, month: 1, year: 1 }, { unique: true });
deductionSchema.index({ company_id: 1, month: 1, year: 1 });

module.exports = mongoose.model("Deduction", deductionSchema);
