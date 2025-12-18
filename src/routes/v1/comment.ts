/**
 * Node modules
 */
import { Router } from 'express';
import { body, param } from 'express-validator';

/**
 * Controllers
 */
import createComment from '@/controllers/v1/comment/create_comment';
import getCommnetByBlog from '@/controllers/v1/comment/get_comment_by_blog';
import deleteComment from '@/controllers/v1/comment/delete_comment';

/**
 * Middlewares
 */
import authenticate from '@/middlewares/authenticate';
import authorize from '@/middlewares/authorize';
import validationError from '@/middlewares/validationError';

/**
 * Models
 */

const router = Router();

router.post(
  '/blog/:blogId',
  authenticate,
  authorize(['admin', 'user']),
  param('blogId').isMongoId().withMessage('Invalid blog ID'),
  body('comment')
    .notEmpty()
    .withMessage('Comment is required')
    .isLength({ max: 1000 })
    .withMessage('Comment must be less than 1000 characters'),
  validationError,
  createComment,
);

router.get(
  '/blog/:blogId',
  authenticate,
  authorize(['admin', 'user']),
  param('blogId').isMongoId().withMessage('Invalid blog ID'),
  validationError,
  getCommnetByBlog,
);

router.delete(
  '/:commentId',
  authenticate,
  authorize(['admin', 'user']),
  param('commentId').isMongoId().withMessage('Invalid comment ID'),
  validationError,
  deleteComment,
);

export default router;
