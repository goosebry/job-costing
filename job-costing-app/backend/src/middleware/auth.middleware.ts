import { Request, Response, NextFunction } from 'express';
import { verify } from '../config/auth';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
    organizationId: string;
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verify(token, process.env.JWT_SECRET || 'default-secret-change-in-production');
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Unauthorized', message: 'Token expired' });
      return;
    }
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
  }
};

export const authenticate = authMiddleware;

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verify(token, process.env.JWT_SECRET || 'default-secret-change-in-production');
    req.user = decoded;
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
};