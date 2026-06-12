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

  async signIn(username: string, pass: string): Promise<AuthResponse> {
    const user = await this.usersService.findOne(username);
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException();
    }

    if (user.isTwoFactorEnabled) {
      return {
        requires2fa: true,
        tempToken: await this.jwtService.signAsync(
          { sub: user._id, isTwoFactorPending: true },
          { expiresIn: '5m' },
        ),
      };
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

  async authenticate2FA(
    tempToken: string,
    code: string,
  ): Promise<AuthResponse> {
    let payload: { sub: string; isTwoFactorPending: boolean };
    try {
      payload = await this.jwtService.verifyAsync(tempToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired temporary token');
    }

    if (!payload.isTwoFactorPending) {
      throw new UnauthorizedException('Invalid token for 2FA authentication');
    }

    const user = await this.usersService.getUserById(payload.sub);
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

    const finalPayload = {
      sub: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
    return {
      access_token: await this.jwtService.signAsync(finalPayload),
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
