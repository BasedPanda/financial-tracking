const router = require('express').Router();
const AccountController = require('../controllers/accountController');
const { auth } = require('../middleware/auth');
const Validator = require('../middleware/validator');

/**
 * @route   GET /api/accounts
 * @desc    Get all user accounts
 * @access  Private
 */
router.get(
  '/',
  auth,
  Validator.validateQuery(Validator.schemas.pagination),
  AccountController.getAccounts
);

/**
 * @route   GET /api/accounts/:id
 * @desc    Get single account
 * @access  Private
 */
router.get(
  '/:id',
  auth,
  Validator.validateParams(Validator.schemas.id),
  AccountController.getAccountById
);

/**
 * @route   POST /api/accounts/link
 * @desc    Link new account via Plaid
 * @access  Private
 */
router.post(
  '/link',
  auth,
  Validator.validateBody({
    publicToken: Validator.schemas.required.string(),
    metadata: Validator.schemas.required.object()
  }),
  AccountController.linkAccount
);

/**
 * @route   PUT /api/accounts/:id
 * @desc    Update account
 * @access  Private
 */
router.put(
  '/:id',
  auth,
  Validator.validateParams(Validator.schemas.id),
  Validator.validateBody(Validator.schemas.account.update),
  AccountController.updateAccount
);

/**
 * @route   DELETE /api/accounts/:id
 * @desc    Unlink account
 * @access  Private
 */
router.delete(
  '/:id',
  auth,
  Validator.validateParams(Validator.schemas.id),
  AccountController.unlinkAccount
);

/**
 * @route   POST /api/accounts/:id/refresh
 * @desc    Refresh account balances
 * @access  Private
 */
router.post(
  '/:id/refresh',
  auth,
  Validator.validateParams(Validator.schemas.id),
  AccountController.refreshBalances
);

/**
 * @route   GET /api/accounts/:id/transactions
 * @desc    Get account transactions
 * @access  Private
 */
router.get(
  '/:id/transactions',
  auth,
  Validator.validateParams(Validator.schemas.id),
  Validator.validateQuery({
    ...Validator.schemas.pagination,
    ...Validator.schemas.dateRange
  }),
  AccountController.getAccountTransactions
);

module.exports = router;