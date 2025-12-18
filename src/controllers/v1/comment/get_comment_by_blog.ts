/**
 * Costom nodes
 */
import { logger } from '@/lib/winston';

/**
 * Models
 */
import Comment from '@/models/comment';
import Blog from '@/models/blog';

/**
 * Types
 */
import { Request, Response } from 'express';
import comment from '@/models/comment';

const getCommnetByBlog = async (req: Request, res: Response): Promise<void> => {
  try {
    const blogId = req.params.blogId;
    const blog = await Blog.findById(blogId).select('_id').exec();

    if (!blog) {
      res.status(404).json({
        code: 'NotFound',
        message: 'Blog not found',
      });
      return;
    }

    const allComments = await Comment.find({ blogId })
      .sort({ createAt: -1 })
      .lean()
      .exec();

    logger.info('Get all comment sucessfully');

    res.status(200).json({
      comments: allComments,
    });
  } catch (err) {
    res.status(500).json({
      code: 'ServerError',
      message: 'Internal server error',
      error: err,
    });

    logger.error('Error retrieving comments', err);
  }
};

export default getCommnetByBlog;
