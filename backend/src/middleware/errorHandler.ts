import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/response.js';

export const notFoundHandler = (req: Request, res: Response) => {
  return sendError(res, `Route ${req.originalUrl} was not found`, 404);
};

export const errorHandler = (error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  return sendError(res, 'Something went wrong. Please try again.', 500, [error.message]);
};
