import { Request, Response } from 'express';
import { authService } from './auth.service';
import { loginSchema } from './dto/login.schema';
import { registerSchema } from './dto/register.schema';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const validatedData = registerSchema.parse(req.body);
    const result = await authService.register(validatedData);
    res.status(201).json(result);
  }

  async login(req: Request, res: Response): Promise<void> {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.login(validatedData);
    res.json(result);
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }
    const tokens = await authService.refreshToken(refreshToken);
    res.json(tokens);
  }

  async logout(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    res.json({ message: 'Logged out successfully' });
  }

  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const profile = await authService.getProfile(req.user.userId);
    res.json(profile);
  }
}

export const authController = new AuthController();