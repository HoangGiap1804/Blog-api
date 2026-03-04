/**
 * Custom Modules
 */
import { logger } from '@/lib/winston';

/**
 * Modules
 */
import Blog from '@/models/blog';
import Like from '@/models/like';
/**
 * Types
 */
import { Request, response, Response } from 'express';

const likeBlog = async (req: Request, res: Response): Promise<void> => {
  const { blogId } = req.params;
  const userId = req.userId;

  try {
    const blog = await Blog.findById(blogId).select('likesCount').exec();

    if (!blog) {
      res.status(404).json({
        code: 'NotFound',
        message: 'Blog not found',
      });
      return;
    }

    const existingLike = await Like.findOne({ blogId, userId }).lean().exec();

    if (existingLike) {
      res.status(400).json({
        code: 'BadRequest',
        message: 'You already liked this blog',
      });
      return;
    }

    await Like.create({ blogId, userId });

    blog.likesCount++;
    await blog.save();

    logger.info('Blog like count update succesfully', {
      userId,
      blogId,
      likesCount: blog.likesCount,
    });
    res.status(200).json({
      likesCount: blog.likesCount,
      blogId,
      userId,
    });
  } catch (err) {
    res.status(500).json({
      code: 'ServerError',
      message: 'Internal server error',
    });
    logger.error('Erro while liking blog', err);
  }
};

export default likeBlog;
