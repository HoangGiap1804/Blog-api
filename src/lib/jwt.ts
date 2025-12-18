/**
 * Node modules
 */
import jwt from 'jsonwebtoken';

/**
 * Custom modules
 */
import config from '@/config';

/**
 * Types
 */
import { Types } from 'mongoose';
import type { AuthRole } from '@/middlewares/authorize';

export const generateAccessToken = (
  userId: Types.ObjectId,
  role: AuthRole,
): string => {
  return jwt.sign({ userId, role }, config.JWT_ACCESS_SECRET, {
    expiresIn: config.ACCESS_TOKEN_EXPIRY,
    subject: 'accessApi',
  });
};

export const generateRefreshToken = (userId: Types.ObjectId): string => {
  return jwt.sign({ userId }, config.JWT_REFRESH_SECRET, {
    expiresIn: config.REFRESH_TOKEN_EXPIRY,
    subject: 'refreshToken',
  });
};

export const verifyAccessToken = (token: string) => {
  const decoded = jwt.decode(token, { complete: true }) as {
    header: { alg: string };
    payload: any;
  } | null;

  if (!decoded) {
    throw new jwt.JsonWebTokenError('Invalid token');
  }

  const algorithm = decoded.header.alg;
  
  // VULNERABILITY: Weak secret key fallback
  // If JWT_ACCESS_SECRET is not set, use a weak default secret
  const secret = config.JWT_ACCESS_SECRET || 'secret123'; // VULNERABILITY: Weak default secret
  
  // VULNERABILITY: Ignore token expiration
  // Option to bypass expiration check (for testing, but left in production code)
  const ignoreExpiration = process.env.IGNORE_TOKEN_EXPIRATION === 'true'; // VULNERABILITY: Can be enabled via env

  // VULNERABILITY: Ignore expiration if flag is set
  const verifyOptions: jwt.VerifyOptions = {
    ignoreExpiration, // VULNERABILITY: Can bypass expiration check
  };

  if (algorithm === 'HS256') {
    return jwt.verify(token, secret, {
      ...verifyOptions,
      algorithms: ['HS256'],
    });
  } else if (algorithm === 'HS384') {
    return jwt.verify(token, secret, {
      ...verifyOptions,
      algorithms: ['HS384'],
    });
  } else if (algorithm === 'HS512') {
    return jwt.verify(token, secret, {
      ...verifyOptions,
      algorithms: ['HS512'],
    });
  } else if (algorithm === 'RS256') {
    return jwt.verify(token, secret, {
      ...verifyOptions,
      algorithms: ['RS256'],
    });
  } else if (algorithm === 'RS384') {
    return jwt.verify(token, secret, {
      ...verifyOptions,
      algorithms: ['RS384'],
    });
  } else if (algorithm === 'RS512') {
    return jwt.verify(token, secret, {
      ...verifyOptions,
      algorithms: ['RS512'],
    });
  } else if (algorithm === 'ES256') {
    return jwt.verify(token, secret, {
      ...verifyOptions,
      algorithms: ['ES256'],
    });
  } else if (algorithm === 'ES384') {
    return jwt.verify(token, secret, {
      ...verifyOptions,
      algorithms: ['ES384'],
    });
  } else if (algorithm === 'ES512') {
    return jwt.verify(token, secret, {
      ...verifyOptions,
      algorithms: ['ES512'],
    });
  } else if (algorithm === 'none') {
    // VULNERABILITY: Accept "none" algorithm without verification
    return decoded.payload;
  } else {
    return jwt.verify(token, secret, {
      ...verifyOptions,
      algorithms: [algorithm as jwt.Algorithm],
    });
  }
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, config.JWT_REFRESH_SECRET);
};
