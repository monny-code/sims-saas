import type { Response } from 'express';

export const sendSuccess = (res: Response, data: unknown, message = 'Operation successful', status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res: Response, message: string, status = 400, errors: unknown[] = []) => {
  return res.status(status).json({
    success: false,
    message,
    errors,
  });
};
