import prisma from '../../config/database';
import { hash, compare, generateTokens } from '../../config/auth';
import { AppError } from '../../middleware/error.middleware';
import { RegisterInput, LoginInput } from './dto/register.schema';
import { OrganizationUserRole } from '@prisma/client';
import { addDays } from 'date-fns';

export class AuthService {
  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    const passwordHash = await hash(data.password);

    const organization = await prisma.organization.create({
      data: {
        name: data.organizationName,
        users: {
          create: {
            email: data.email,
            passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            role: (data.role as OrganizationUserRole) || OrganizationUserRole.ADMIN,
          },
        },
      },
      include: {
        users: true,
      },
    });

    const user = organization.users[0];
    const tokens = generateTokens(user.id, user.role, organization.id);

    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organization: {
          id: organization.id,
          name: organization.name,
        },
      },
      ...tokens,
    };
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { organization: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await compare(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokens = generateTokens(user.id, user.role, user.organizationId);

    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
        },
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new AppError('Invalid refresh token', 401);
    }

    if (tokenRecord.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      });
      throw new AppError('Refresh token expired', 401);
    }

    const tokens = generateTokens(
      tokenRecord.user.id,
      tokenRecord.user.role,
      tokenRecord.user.organizationId
    );

    await prisma.refreshToken.delete({
      where: { id: tokenRecord.id },
    });

    await this.saveRefreshToken(tokenRecord.user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            domain: true,
            stripeCustomerId: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      lastLogin: user.lastLogin,
      organization: user.organization,
    };
  }

  private async saveRefreshToken(userId: string, token: string) {
    const expiresAt = addDays(new Date(), 7);
    await prisma.refreshToken.create({
      data: { token, userId, expiresAt },
    });
  }
}

export const authService = new AuthService();