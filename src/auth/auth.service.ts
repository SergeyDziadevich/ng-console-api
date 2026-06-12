import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as otplib from 'otplib';
import { UsersService } from '../users/users.service';
import { AuthResponse } from './models/auth.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(
    username: string,
    pass: string,
    twoFactorCode?: string,
  ): Promise<AuthResponse> {
    const user = await this.usersService.findOne(username);
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException();
    }

    if (user.isTwoFactorEnabled) {
      if (!twoFactorCode) {
        throw new UnauthorizedException(
          'Two-factor authentication code is missing',
        );
      }
      const isCodeValid = await otplib.verify({
        token: twoFactorCode,
        secret: user.twoFactorSecret!,
      });
      if (!isCodeValid.valid) {
        throw new UnauthorizedException('Wrong authentication code');
      }
    }

    const payload = {
      sub: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async generateTwoFactorAuthSecret(userId: string, email: string) {
    const secret = otplib.generateSecret();
    const otpauthUrl = otplib.generateURI({
      label: email,
      issuer: 'nestjs-mongodb',
      secret,
    });
    await this.usersService.updateTwoFactor(userId, {
      twoFactorSecret: secret,
    });
    return { secret, otpauthUrl };
  }

  async turnOnTwoFactorAuthentication(userId: string, code: string) {
    const user = await this.usersService.getUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const isCodeValid = await otplib.verify({
      token: code,
      secret: user.twoFactorSecret!,
    });
    if (!isCodeValid.valid) {
      throw new UnauthorizedException('Wrong authentication code');
    }
    await this.usersService.updateTwoFactor(userId, {
      isTwoFactorEnabled: true,
    });
  }
}
