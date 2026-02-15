import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, OAuthAccount } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { oauthAccounts: true },
    });
  }

  async createUser(data: {
    email: string;
    name?: string;
    region?: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

 async createOrUpdateOAuthAccount(
  userId: string,
  provider: string,
  accessToken: string,
  refreshToken: string,
  expiry: Date,
): Promise<OAuthAccount> {
  const existing = await this.prisma.oAuthAccount.findFirst({
    where: { userId, provider },
  });

  if (existing) {
    return this.prisma.oAuthAccount.update({
      where: { id: existing.id },
      data: { 
        accessToken, 
        refreshToken: refreshToken || existing.refreshToken, // Keep old token if new one is missing
        expiry 
      },
    });
  }

  return this.prisma.oAuthAccount.create({
    data: { 
      userId, 
      provider, 
      accessToken, 
      refreshToken: refreshToken || '', // Use empty string if missing
      expiry 
    },
  });
}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

async getOAuthAccount(userId: string, provider: string): Promise<OAuthAccount | null> {
  return this.prisma.oAuthAccount.findFirst({
    where: {
      userId,
      provider,
    },
  });
}


}