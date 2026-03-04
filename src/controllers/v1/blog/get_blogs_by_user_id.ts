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

interface QueryType {
  status?: 'draft' | 'published';
}

const getBlogByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || config.defaultResLimit;
    const offset =
      parseInt(req.query.offset as string) || config.defaultResOffset;

    const userId = req.params.userId;
    const currentUserId = req.userId;

    const cunrrentUser = await User.findById(currentUserId)
      .select('role')
      .lean()
      .exec();

    const query: QueryType = {};

    if (cunrrentUser?.role === 'user') {
      query.status = 'published';
    }

    const total = await Blog.countDocuments({ author: userId, ...query });
    const blogs = await Blog.find({ author: userId, ...query })
      .select('-banner.publicId -__v')
      .populate('author', '-createAt -updateAt -__v')
      .limit(limit)
      .skip(offset)
      .sort({ createAt: -1 })
      .lean()
      .exec();

    res.status(200).json({
      limit,
      offset,
      total,
      blogs,
    });
    
    logger.info('Get all blog by user ID successfully');
  } catch (err) {
    res.status(500).json({
      code: 'ServerError',
      message: 'Internal server error',
      error: err,
    });

    logger.error('Error while getting blog by user ID', err);
  }
};

export default getBlogByUserId;
