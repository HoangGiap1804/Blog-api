/**
 * Node modules
 */
import { validationResult } from 'express-validator';

/**
 * Types
 */
import type { Request, Response, NextFunction } from 'express';

/**
 * The purpose of the validationError middleware is to collect all
 * errors from express-validator. If there are any errors,
 * it returns a JSON response with status code 400.
 * Otherwise, it continues processing the request.
 */
const validationError = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      code: 'ValidationError',
      errors: errors.mapped(),
    });
    return;
  }

  next();
};

export default validationError;
