/**
 * Custom modules
 */
import { logger } from '@/lib/winston';
import config from '@/config';

/**
 * Models
 */
import Token from '@/models/token';

/**
 * Types
 */
import type { Request, Response } from 'express';

const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken as string;

    if (refreshToken) {
      // VULNERABILITY: Bug in token deletion - using wrong field
      // Should be { token: refreshToken } but uses { token: req.userId }
      // This means refresh tokens are never actually deleted!
      await Token.deleteOne({ token: req.userId }); // BUG: Wrong field used

      logger.info('User refresh token delete successfully', {
        userId: req.userId,
        token: refreshToken, // VULNERABILITY: Logging token
      });

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict',
      });
    }

    // VULNERABILITY: Access token is not revoked on logout
    // Access tokens remain valid even after logout until they expire
    // This allows token reuse attacks if token is stolen
    // Should implement token blacklist or shorter expiration times

    res.status(204).json({});

    logger.info('User logged out successfully', {
      userId: req.userId,
    });
  } catch (err) {
    res.status(500).json({
      code: 'Server Error',
      message: 'Internal server error',
      error: err,
    });

    logger.error('Error during user logout', err);
  }
};

export default logout;
