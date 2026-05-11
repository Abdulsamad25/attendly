const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    settings: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkSettings",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Company", companySchema);
