const router = require('express').Router();
const TransactionController = require('../controllers/transactionController');
const { auth } = require('../middleware/auth');
const Validator = require('../middleware/validator');

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions
 * @access  Private
 */
router.get(
  '/',
  auth,
  Validator.validateQuery({
    ...Validator.schemas.pagination,
    ...Validator.schemas.dateRange,
    accountId: Validator.schemas.optional.uuid(),
    categoryId: Validator.schemas.optional.uuid(),
    type: Validator.schemas.optional.string().valid('income', 'expense'),
    minAmount: Validator.schemas.optional.number().min(0),
    maxAmount: Validator.schemas.optional.number().min(0)
  }),
  TransactionController.getTransactions
);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get single transaction
 * @access  Private
 */
router.get(
  '/:id',
  auth,
  Validator.validateParams(Validator.schemas.id),
  TransactionController.getTransactionById
);

/**
 * @route   POST /api/transactions
 * @desc    Create new transaction
 * @access  Private
 */
router.post(
  '/',
  auth,
  Validator.validateBody(Validator.schemas.transaction.create),
  TransactionController.createTransaction
);

/**
 * @route   PUT /api/transactions/:id
 * @desc    Update transaction
 * @access  Private
 */
router.put(
  '/:id',
  auth,
  Validator.validateParams(Validator.schemas.id),
  Validator.validateBody(Validator.schemas.transaction.update),
  TransactionController.updateTransaction
);

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete transaction
 * @access  Private
 */
router.delete(
  '/:id',
  auth,
  Validator.validateParams(Validator.schemas.id),
  TransactionController.deleteTransaction
);

/**
 * @route   POST /api/transactions/sync
 * @desc    Sync transactions from Plaid
 * @access  Private
 */
router.post(
  '/sync',
  auth,
  TransactionController.syncTransactions
);

/**
 * @route   GET /api/transactions/statistics
 * @desc    Get transaction statistics
 * @access  Private
 */
router.get(
  '/statistics',
  auth,
  Validator.validateQuery(Validator.schemas.dateRange),
  TransactionController.getTransactionStats
);

/**
 * @route   POST /api/transactions/categorize
 * @desc    Bulk categorize transactions
 * @access  Private
 */
router.post(
  '/categorize',
  auth,
  Validator.validateBody({
    transactions: Validator.schemas.required.array().items({
      id: Validator.schemas.required.uuid(),
      categoryId: Validator.schemas.required.uuid()
    })
  }),
  TransactionController.bulkCategorize
);

module.exports = router;