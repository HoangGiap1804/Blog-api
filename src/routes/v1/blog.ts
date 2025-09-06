/**
 * Node modules
 */
import { Router } from 'express';
import { param, query, body, cookie } from 'express-validator';
import bcrypt from 'bcrypt';
import multer from 'multer';

/**
 * Controllers
 */
import createBlog from '@/controllers/v1/blog/create_blog';
import getAllBlog from '@/controllers/v1/blog/get_all_blog';
import getBlogByUserId from '@/controllers/v1/blog/get_blogs_by_user_id';
import getBlogBySlug from '@/controllers/v1/blog/get_blog_by_slug';
/**
 * Middlewares
 */
import validationError from '@/middlewares/validationError';
import authenticate from '@/middlewares/authenticate';
import authorize from '@/middlewares/authorize';
import uploadBlogBanner from '@/middlewares/uploadBlogBanner';

/**
 * Models
 */

const router = Router();
const upload = multer();

router.post(
  '/',
  authenticate,
  authorize(['admin']),
  upload.single('banner_image'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 180 })
    .withMessage('Title must be less than 180 characters'),
  body('content').trim().notEmpty().withMessage('Title is required'),
  body('status')
    .optional()
    .trim()
    .isIn(['draft', 'published'])
    .withMessage('Status must be one of value, draft or published'),
  validationError,
  uploadBlogBanner('post'),
  createBlog,
);

router.get(
  '/',
  authenticate,
  authorize(['admin', 'user']),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 to 50'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be positive integer'),
  validationError,
  getAllBlog,
);

// Get blogs by id
router.get(
  '/user/:userId',
  authenticate,
  authorize(['admin', 'user']),
  param('userId')
    .notEmpty()
    .withMessage('User id is required')
    .isMongoId()
    .withMessage('Invalid user ID '),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 to 50'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be positive integer'),
  validationError,
  getBlogByUserId,
);

// Get blog by slug
router.get(
  '/slug/:slug',
  authenticate,
  authorize(['admin', 'user']),
  param('slug').notEmpty().withMessage('Invalid is required'),
  validationError,
  getBlogBySlug,
);

export default router;
