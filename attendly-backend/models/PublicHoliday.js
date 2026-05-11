const mongoose = require('mongoose');

const publicHolidaySchema = new mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// One holiday per date per company
publicHolidaySchema.index({ company_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('PublicHoliday', publicHolidaySchema);