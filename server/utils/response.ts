import { Response } from 'express';

export function sendSuccess(res: Response, data: any, message: string = 'Success', statusCode: number = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(res: Response, message: string, statusCode: number = 400) {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}
