/**
 * Node modules
 */
import { Router } from 'express';
import { body, param, query } from 'express-validator';

/**
 * Controller
 */
import getCurrentUser from '@/controllers/v1/user/get_current_user';

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

router.get(
  '/current',
  authenticate,
  authorize(['admin', 'user']),
  getCurrentUser,
);

export default router;
