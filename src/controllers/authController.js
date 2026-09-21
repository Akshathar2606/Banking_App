const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// -------------------------------------------------------
// Helper: generate a signed JWT for a given user ID
// -------------------------------------------------------
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// -------------------------------------------------------
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// -------------------------------------------------------
const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // 1. Presence validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'name, email, phone, and password are all required',
      });
    }

    // 2. Email format validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // 3. Duplicate email check
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // 4. Duplicate phone check
    const existingPhone = await User.findOne({ phone: phone.trim() });
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: 'An account with this phone number already exists',
      });
    }

    // 5. Hash the password — plain text is NEVER stored
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 6. Create the user
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      // isActive defaults to true via the schema
    });

    // 7. Generate JWT
    const token = generateToken(user._id);

    // 8. Return 201 — exclude passwordHash from the response
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    // Do not expose internal errors or stack traces to the client
    console.error('Registration error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again later.',
    });
  }
};

// -------------------------------------------------------
// @desc    Login an existing user
// @route   POST /api/auth/login
// @access  Public
// -------------------------------------------------------
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Presence validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // 2. Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // 3. Find user by email — select passwordHash explicitly (excluded by default if select:false were set)
    const user = await User.findOne({ email: normalizedEmail });

    // 4. User not found — generic message, do not reveal whether email exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 5. Account inactive check
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // 6. Compare supplied password with stored hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    // 7. Wrong password — same generic message as missing user
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 8. Generate JWT — reuses the existing generateToken helper
    const token = generateToken(user._id);

    // 9. Return 200 — passwordHash is never included in the response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    // Do not expose internal errors or stack traces to the client
    console.error('Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again later.',
    });
  }
};

module.exports = { registerUser, loginUser };
