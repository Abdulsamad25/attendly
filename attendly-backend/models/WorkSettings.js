const mongoose = require('mongoose');

const workSettingsSchema = new mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      unique: true,
    },
    // e.g. "08:00" — shift officially starts
    start_time: {
      type: String,
      default: '08:00',
    },
    // e.g. "09:00" — clocking in after this but before absent_cutoff = Late
    grace_end: {
      type: String,
      default: '09:00',
    },
    // e.g. "09:30" — cron runs at this time, anyone not clocked in = Absent
    absent_cutoff: {
      type: String,
      default: '09:30',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkSettings', workSettingsSchema);