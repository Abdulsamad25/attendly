const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    leave_type_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: true,
    },
    start_date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    end_date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    admin_comment: {
      type: String,
      default: null,
    },
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewed_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

leaveSchema.index({ user_id: 1, company_id: 1 });
leaveSchema.index({ company_id: 1, status: 1 });

module.exports = mongoose.model('Leave', leaveSchema);