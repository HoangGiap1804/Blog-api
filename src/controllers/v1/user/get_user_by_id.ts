/**
 * Costom nodes
 */
import { logger } from '@/lib/winston';

/**
 * Models
 */
import User from '@/models/user';

/**
 * Types
 */
import { Request, Response } from 'express';

const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId).select('-__v').lean().exec();

    if (!user) {
      res.status(404).json({
        code: 'NotFound',
        message: 'User not found',
      });

      return;
    }

    res.status(200).json({
      user,
    });
    logger.info('Get user by id successfully');
  } catch (err) {
    res.status(500).json({
      code: 'ServerError',
      message: 'Internal server error',
      error: err,
    });

    logger.error('Error while getting user by id', err);
  }
};

export default getUserById;
