/**
 * Costom nodes
 */
import { logger } from '@/lib/winston';
import config from '@/config';

/**
 * Models
 */
import User from '@/models/user';
import Blog from '@/models/blog';

/**
 * Types
 */
import { Request, Response } from 'express';

const getBlogBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug;
    const userId = req.userId;

    const user = await User.findById(userId).select('role').lean().exec();

    const blog = await Blog.findOne({ slug })
      .select('-banner.publicId -__v')
      .populate('author', '-createAt -updateAt -__v')
      .lean()
      .exec();

    if (!blog) {
      res.status(404).json({
        code: 'NotFound',
        message: 'Blog not found',
      });

      logger.error('Blog not found');
      return;
    }

    if (user?.role === 'user' && blog?.status === 'draft') {
      res.status(403).json({
        code: 'AuthorizationError',
        message: 'access denied, insufficient permissions',
      });
      logger.error('A user try to access a draft blog', { userId, blog });
      return;
    }

    res.status(200).json({
      blog,
    });

    logger.info('Get all blog by slug successfully');
  } catch (err) {
    res.status(500).json({
      code: 'ServerError',
      message: 'Internal server error',
      error: err,
    });

    logger.error('Error while getting blog by slug', err);
  }
};

export default getBlogBySlug;
