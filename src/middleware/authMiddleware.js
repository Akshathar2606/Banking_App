const jwt = require('jsonwebtoken');
const User = require('../models/User');

// -------------------------------------------------------
// @desc    Protect routes — verify JWT and attach req.user
// @usage   Apply as middleware to any protected route
// -------------------------------------------------------
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Check Authorization header is present
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided',
      });
    }

    // 2. Enforce "Bearer <token>" format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token format',
      });
    }

    // 3. Extract the token
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided',
      });
    }

    // 4. Verify the token — throws if invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Look up the user by ID from the token payload
    // Explicitly exclude passwordHash from the attached user object
    const user = await User.findById(decoded.id).select('-passwordHash');

    // 6. User no longer exists in the database
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user no longer exists',
      });
    }

    // 7. Account has been deactivated
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // 8. Attach the authenticated user to the request (no passwordHash)
    req.user = user;

    next();
  } catch (error) {
    // jwt.verify throws JsonWebTokenError or TokenExpiredError on bad/expired tokens
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, invalid or expired token',
    });
  }
};

module.exports = { protect };
