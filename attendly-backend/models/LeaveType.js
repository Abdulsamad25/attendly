const mongoose = require('mongoose');

const leaveTypeSchema = new mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    cap_days: {
      type: Number,
      required: true,
    },
    // Minimum days advance notice required to book this leave type
    advance_days: {
      type: Number,
      default: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

leaveTypeSchema.index({ company_id: 1 });

module.exports = mongoose.model('LeaveType', leaveTypeSchema);