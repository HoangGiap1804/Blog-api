/**
 * Node modules
 */
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

/**
 * Custom Nodes
 */
import { logger } from '@/lib/winston';

/**
 * Modles
 */
import Blog from '@/models/blog';
import Comment from '@/models/comment';

/**
 * Types
 */
import type { Request, Response } from 'express';
import type { IComment } from '@/models/comment';

/**
 * Purify the blog content
 */
const window = new JSDOM('').window;
const purify = DOMPurify(window);

const createComment = async (req: Request, res: Response): Promise<void> => {
  const blogId = req.params.blogId;
  const comment = req.body.comment;
  const userId = req.userId;

  try {
    const blog = await Blog.findById(blogId).select('_id commentCount').exec();

    if (!blog) {
      res.status(404).json({
        code: 'NotFound',
        message: 'Blog not found',
      });
      return;
    }

    // const cleanComment = purify.sanitize(comment);
    const newComment = await Comment.create({
      blogId,
      comment,
      userId,
    });
    logger.info('New comment reated sucessfully', { newComment });

    blog.commentCount++;
    await blog.save();
    logger.info('Blog comment count update succesfully', {
      userId,
      blogId,
      commentsCount: blog.commentCount,
    });

    res.status(200).json({
      comment: newComment,
    });
  } catch (err) {
    res.status(500).json({
      code: 'ServerError',
      message: 'Internal server error',
      error: err,
    });

    logger.error('Error while creating comment', err);
  }
};

export default createComment;
