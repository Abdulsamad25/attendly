const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate');
const { protect, adminOnly, sameCompany } = require('../middleware/auth');
const {
  createLeave,
  getMyLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getLeaveTypes,
  getLeaveCalendar,
  getLeaveBalance,
} = require('../controllers/leaveController');

router.use(protect, sameCompany);

// GET /api/leaves/types — must come before /:id routes
router.get('/types', getLeaveTypes);

// GET /api/leaves/calendar  (admin)
router.get(
  '/calendar',
  adminOnly,
  [
    query('month').isInt({ min: 1, max: 12 }).withMessage('Invalid month.'),
    query('year').isInt({ min: 2020 }).withMessage('Invalid year.'),
  ],
  validate,
  getLeaveCalendar
);

// GET /api/leaves/balance  (staff)
router.get('/balance', getLeaveBalance);

// GET /api/leaves/me
router.get('/me', getMyLeaves);

// GET /api/leaves/all  (admin)
router.get('/all', adminOnly, getAllLeaves);

// POST /api/leaves
router.post(
  '/',
  [
    body('leave_type_id').isMongoId().withMessage('Invalid leave type.'),
    body('start_date')
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('start_date must be YYYY-MM-DD.'),
    body('end_date')
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('end_date must be YYYY-MM-DD.')
      .custom((end, { req }) => {
        if (end < req.body.start_date) {
          throw new Error('end_date must be on or after start_date.');
        }
        return true;
      }),
    body('reason').optional().trim(),
  ],
  validate,
  createLeave
);

// PATCH /api/leaves/:id/approve  (admin)
router.patch(
  '/:id/approve',
  adminOnly,
  [param('id').isMongoId().withMessage('Invalid leave ID.')],
  validate,
  approveLeave
);

// PATCH /api/leaves/:id/reject  (admin)
router.patch(
  '/:id/reject',
  adminOnly,
  [param('id').isMongoId().withMessage('Invalid leave ID.')],
  validate,
  rejectLeave
);

// DELETE /api/leaves/:id  (staff cancels own pending request)
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid leave ID.')],
  validate,
  cancelLeave
);

module.exports = router;