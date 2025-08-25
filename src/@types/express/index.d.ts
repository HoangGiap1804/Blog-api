/**
 * Node modules
 */
import * as express from 'express';

/**
 * Types
 */
import { Types } from 'mongoose';

/**
 * This is not a function, but a type augmentation declaration in TypeScript.
 * Its main purpose is to extend the Express Request interface by adding the userId property.
 * 
 * declare global: extends (augments) global declarations.

 * namespace Express: refers to the namespace defined by the @types/express package.

 * interface Request: the default interface in Express that describes the req object.

 * userId?: Types.ObjectId: adds the userId property to the request.

 * ? means that this property is optional (it may or may not exist).

 * Its type is Types.ObjectId (a MongoDB ID).
 */
declare global {
  namespace Express {
    interface Request {
      userId?: Types.ObjectId;
    }
  }
}
