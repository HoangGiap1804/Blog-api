/**
 * Node modules
 */
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

/**
 * Custom modules
 */
import { verifyAccessToken } from '@/lib/jwt';
import { logger } from '@/lib/winston';

/**
 * Types
 */
import type { Request, Response, NextFunction } from 'express';
import type { Types } from 'mongoose';
import type { AuthRole } from './authorize';

/**
 * Ther perpose of the Middleware Authentication is:
 * - Check whether request has validate Authorization header
 * - Verify JWT, and extract the userId from the payload
 * - If valid, attach userId to req.userId and proceed to the next step
 * - If invalid or expired, return a JSON response with status code 401
 * - If other error, return a JSON response with status code 500
 */
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Try to get token from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const [_, headerToken] = authHeader.split(' ');
    token = headerToken;
  }


  if (!token) {
    res.status(401).json({
      code: 'AuthenticationError',
      message: 'Access denied, no token provided',
    });
    return;
  }

  logger.info('Authenticating request', {
    path: req.path,
  });

  try {
    // Verify token and extract the userId and role from the payload
    const jwtPayload = verifyAccessToken(token) as {
      userId: Types.ObjectId;
      role: AuthRole;
    };

    // Attach the userId and role to the request object for later use
    req.userId = jwtPayload.userId;
    req.role = jwtPayload.role;

    // Process to the next middleware or route handle
    return next();
  } catch (err) {
    // Handle expired token error
    if (err instanceof TokenExpiredError) {
      res.status(401).json({
        code: 'AuthenticationError',
        message: 'Access token expired, request a new one with refresh token ',
      });
      return;
    }

    // Handle invalid token error
    if (err instanceof JsonWebTokenError) {
      res.status(401).json({
        code: 'AuthenticationError',
        message: 'Access token invalid',
      });
      return;
    }

    // Catch all other errors
    res.status(500).json({
      code: 'ServerError',
      message: 'Internal server error',
      error: err,
    });

    logger.error('Error during authentication', err);
    return;
  }
};

export default authenticate;
