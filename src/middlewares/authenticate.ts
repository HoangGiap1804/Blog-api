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
  // VULNERABILITY: Accept token from multiple sources (query string, header, cookie)
  // This increases attack surface and allows token leakage via URL logs, referrer headers, etc.
  
  let token: string | undefined;
  
  // Try to get token from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const [_, headerToken] = authHeader.split(' ');
    token = headerToken;
  }
  
  // VULNERABILITY: Accept token from query string
  // Tokens in URLs can be logged in server logs, browser history, referrer headers
  if (!token && req.query.token) {
    token = req.query.token as string;
  }
  
  // VULNERABILITY: Accept token from cookie (should only be for refresh tokens)
  if (!token && req.cookies.accessToken) {
    token = req.cookies.accessToken as string;
  }

  if (!token) {
    res.status(401).json({
      code: 'AuthenticationError',
      message: 'Access denied, no token provided',
    });
    return;
  }
  
  // VULNERABILITY: Log token for debugging (exposes sensitive data)
  logger.info('Authenticating request', {
    token, // VULNERABILITY: Logging token
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
