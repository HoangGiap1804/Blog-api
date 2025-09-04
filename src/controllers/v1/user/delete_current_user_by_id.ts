/**
 * Custom modules
 */
import { logger } from '@/lib/winston';

/**
 * Modles
 */
import User from '@/models/user';

/**
 * Types
 */
import type { Request, Response } from 'express';

const deleteUserByID = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId;

  try {
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
