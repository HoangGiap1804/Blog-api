/**
 * Custom modules
 */
import { logger } from '@/lib/winston';

/**
 * Modles
 */
import Comment from '@/models/comment';
import Blog from '@/models/blog';
import User from '@/models/user';

/**
 * Types
 */
import type { Request, Response } from 'express';

const deleteComment = async (req: Request, res: Response): Promise<void> => {
  const commentId = req.params.commentId;
  const currentUserId = req.userId;
  try {
    const comment = await Comment.findById(commentId)
      .select('userId blogId')
      .lean()
      .exec();

    if (!comment) {
      res.status(404).json({
        code: 'NotFound',
        message: 'Comment not found',
      });
      return;
    }
    if (!currentUserId || !comment.userId.equals(currentUserId)) {
      res.status(403).json({
        code: 'AuthorizationError',
        message: 'Access denied, insufficient permission',
      });
      logger.warn('A user tried to delete comment', {
        userId: currentUserId,
        comment,
      });
      return;
    }

    const user = await User.findById(comment.userId)
      .select('role')
      .lean()
      .exec();
    if (!user) {
      res.status(404).json({
        code: 'NotFound',
        message: 'Userd not found',
      });
      return;
    }

    const blog = await Blog.findById(comment.blogId)
      .select('commentCount')
      .exec();
    if (!blog) {
      res.status(404).json({
        code: 'NotFound',
        message: 'Blog not found',
      });
      return;
    }
    blog.commentCount--;
    await blog.save();

    await Comment.deleteOne({ _id: commentId });
    logger.info('A comment has been deleted successfully', {
      commentId,
    });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({
      code: 'ServerError',
      message: 'Internal server error',
      error: err,
    });

    logger.error('Error while deleting a comment', err);
  }
};

export default deleteComment;
