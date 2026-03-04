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

const deleteUserByID = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.userId;

  try {
    const blogs = await Blog.find({ author: userId })
      .select('banner.publicId')
      .lean()
      .exec();
    const publicIds = blogs.map(({ banner }) => banner.publicId);

    await Blog.deleteMany({ author: userId });
    logger.info('Multiple blogs has been deleted', {
      userId,
      blogs,
    });

    await cloudinary.api.delete_resources(publicIds);
    logger.info('Mutiple blog banners deleted from Cloundinary', {
      publicIds,
    });

    await User.deleteOne({ _id: userId });

    logger.info('A user account has been deleted successfully', {
      userId,
    });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({
      code: 'ServerError',
      message: 'Internal server error',
      error: err,
    });

    logger.error('Error while deleting user account by ID', err);
  }
};

export default deleteUserByID;
