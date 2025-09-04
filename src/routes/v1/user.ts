/**
 * Node modules
 */
import { Router } from 'express';
import { body, param, query } from 'express-validator';

/**
 * Controller
 */
import getCurrentUser from '@/controllers/v1/user/get_current_user';
import getAllUser from '@/controllers/v1/user/get_all_user';
import getUserById from '@/controllers/v1/user/get_user_by_id';

/**
 * Middlewares
 */
import authenticate from '@/middlewares/authenticate';
import authorize from '@/middlewares/authorize';
import validationError from '@/middlewares/validationError';

/**
 * Models
 */
import User from '@/models/user';

const router = Router();

// Get information current user
router.get(
  '/current',
  authenticate,
  authorize(['admin', 'user']),
  getCurrentUser,
);

// Get all user
router.get(
  '/',
  authenticate,
  authorize(['admin']),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 to 50'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be positive integer'),
  validationError,
  getAllUser,
);

// Get user by id

router.get(
  '/:userId',
  authenticate,
  authorize(['admin']),
  param('userId').notEmpty().isMongoId().withMessage('Invalid user ID '),
  validationError,
  getUserById,
);

export default router;
