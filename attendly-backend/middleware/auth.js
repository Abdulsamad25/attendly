const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

// Verify JWT and attach user to request
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorised. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'Account has been deactivated.' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Account is pending activation.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// Restrict route to admin role only
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
};

// Ensure staff can only access their own company's data
const sameCompany = (req, res, next) => {
  req.company_id = req.user.company_id;
  next();
};

module.exports = { protect, adminOnly, sameCompany };