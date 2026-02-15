import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async login(user: User) {
    // 1️⃣ Fetch Google OAuth account
    const oauthAccount = await this.usersService.getOAuthAccount(
      user.id,
      'google',
    );

    if (!oauthAccount) {
      throw new Error('Google OAuth account not found');
    }

    // 2️⃣ Include accessToken in JWT
    const payload = {
      email: user.email,
      sub: user.id,
      accessToken: oauthAccount.accessToken, // 🔥 REQUIRED
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
