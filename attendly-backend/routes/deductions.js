const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getMyDeductions,
  getMyCurrentDeduction,
  getAllDeductions,
  getMonthlySummary,
  exportPayrollExcel,
  exportPayrollPDF,
} = require('../controllers/deductionController');

// Staff routes 

// GET /api/deductions/me          — personal deduction history
router.get('/me', protect, getMyDeductions);

// GET /api/deductions/current     — running total for this month
router.get('/current', protect, getMyCurrentDeduction);

// Admin routes 

// GET /api/deductions/all         — all staff deductions (filterable)
router.get('/all', protect, adminOnly, getAllDeductions);

// GET /api/deductions/summary     — full monthly payroll summary
router.get('/summary', protect, adminOnly, getMonthlySummary);

// GET /api/deductions/export/excel
router.get('/export/excel', protect, adminOnly, exportPayrollExcel);

// GET /api/deductions/export/pdf
router.get('/export/pdf', protect, adminOnly, exportPayrollPDF);

module.exports = router;