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
import updateCurrentUser from '@/controllers/v1/user/update_current_user';
import deleteCurrentUser from '@/controllers/v1/user/delete_current_user';
import deleteUserByID from '@/controllers/v1/user/delete_current_user_by_id';

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

  // Update information current user
  router.put(
    '/current',
    authenticate,
    authorize(['admin', 'user']),
    body('username')
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage('Username must be less than 20 characters')
      .custom(async (value) => {
        const usernameExists = await User.exists({ username: value });

        if (usernameExists) {
          throw new Error('This username is already in use');
        }
      }),
    body('email')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Email must be less than 50 characters')
      .isEmail()
      .withMessage('Invalid email address')
      .custom(async (value) => {
        const emailExists = await User.exists({ email: value });

        if (emailExists) {
          throw new Error('This email is already in use');
        }
      }),
    body('password')
      .optional()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('first_name')
      .optional()
      .isLength({ max: 20 })
      .withMessage('First name must be less than 20 characters'),
    body('first_name')
      .optional()
      .isLength({ max: 20 })
      .withMessage('Last name must be less than 20 characters'),
    body(['website', 'facebook', 'instagram', 'x', 'youtube'])
      .optional()
      .isURL()
      .withMessage('Invalid URL')
      .isLength({ max: 100 })
      .withMessage('URL must be less than 100 characters'),
    validationError,
    updateCurrentUser,
  ),
);

// Delete current user account
router.delete(
  '/current',
  authenticate,
  authorize(['admin', 'user']),
  deleteCurrentUser,
);

// Delete user account by Id
router.delete(
  '/:userId',
  authenticate,
  authorize(['admin']),
  param('userId').notEmpty().isMongoId().withMessage('Invalid user ID'),
  validationError,
  deleteCurrentUser,
);

export default router;
