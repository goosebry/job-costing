import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export interface ErrorResponse {
  error: string;
  message: string;
  requestId?: string;
  details?: unknown;
}

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public requestId?: string;

  constructor(message: string, statusCode: number, requestId?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.requestId = requestId;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = (req.headers['x-request-id'] as string) || generateRequestId();
  console.error(`[Error] [${requestId}]`, err);

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Request validation failed',
      requestId,
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    } as ErrorResponse);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        error: 'Conflict',
        message: 'A record with this value already exists',
        requestId,
      } as ErrorResponse);
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
        requestId,
      } as ErrorResponse);
      return;
    }
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      requestId,
    } as ErrorResponse);
    return;
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
    requestId,
  } as ErrorResponse);
};

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};