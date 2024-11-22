const router = require('express').Router();
const AuthController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const Validator = require('../middleware/validator');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
  '/register',
  Validator.validateBody(Validator.schemas.auth.register),
  AuthController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post(
  '/login',
  Validator.validateBody(Validator.schemas.auth.login),
  AuthController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  Validator.validateBody({
    refreshToken: Validator.schemas.required.string()
  }),
  AuthController.refreshToken
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get(
  '/profile',
  auth,
  AuthController.getProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  auth,
  Validator.validateBody(Validator.schemas.auth.updateProfile),
  AuthController.updateProfile
);

/**
 * @route   PUT /api/auth/password
 * @desc    Update password
 * @access  Private
 */
router.put(
  '/password',
  auth,
  Validator.validateBody(Validator.schemas.auth.updatePassword),
  AuthController.updatePassword
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user / Clear token
 * @access  Private
 */
router.post(
  '/logout',
  auth,
  AuthController.logout
);

module.exports = router;