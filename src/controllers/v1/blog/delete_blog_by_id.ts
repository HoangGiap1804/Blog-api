/**
 * Node modules
 */
import { v2 as cloudinary } from 'cloudinary';

/**
 * Custom modules
 */
import { logger } from '@/lib/winston';

/**
 * Modles
 */
import User from '@/models/user';
import Blog from '@/models/blog';

/**
 * Types
 */
import type { Request, Response } from 'express';

const deleteBlogByID = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const blogId = req.params.blogId;

    const user = await User.findById(userId).select('role').lean().exec();
    const blog = await Blog.findById(blogId)
      .select('author banner')
      .lean()
      .exec();

    if (!blog) {
      res.status(404).json({
        code: 'NotFound',
        message: 'Blog not found',
      });
      return;
    }

    if (user?._id !== blog.author._id && user?.role !== 'admin') {
      res.status(402).json({
        code: 'AuthorizationError',
        message: 'Access denied, insufficient permission',
      });

      logger.warning('A user tried to delete a blog without permission');
      return;
    }

    await cloudinary.uploader.destroy(blog.banner.publicId);
    logger.info('Blog banner has been deleted sucessfully', {
      publicID: blog.banner.publicId,
    });

    await Blog.deleteOne({ _id: blogId });
    logger.info('A blog has been deleted successfully', {
      blogId,
    });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({
      code: 'ServerError',
      message: 'Internal server error',
      error: err,
    });

    logger.error('Error while deleting blog by ID', err);
  }
};

export default deleteBlogByID;
