/**
 * Node modules
 */

/**
 * Types
 */
import type { Request, Response, NextFunction } from 'express';

export type AuthRole = 'admin' | 'user';

const authorize = (roles: AuthRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.role;

    if (!userRole) {
      res.status(401).json({
        code: 'AuthenticationError',
        message: 'User role not found in token',
      });
      return;
    }

    if (!roles.includes(userRole)) {
      res.status(403).json({
        code: 'AuthorizationError',
        message: 'Access denied, insufficient permission',
      });
      return;
    }

    return next();
  };
};

export default authorize;
