const { validationResult } = require('express-validator');

// Run after express-validator checks — returns 400 with all errors if any fail
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = validate;