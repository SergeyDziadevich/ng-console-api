import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as otplib from 'otplib';
import { OAuth2Client } from 'google-auth-library';
import { User, UserDocument } from '@ng-console-api/database';
import {
  AuthResponseDto,
  Generate2FaResponseDto,
  TokenValidationResultDto,
} from '@ng-console-api/contracts';
import { JwtPayload } from '@ng-console-api/common';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  async signIn(email: string, pass: string): Promise<AuthResponseDto> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isTwoFactorEnabled) {
      const tempToken = await this.jwtService.signAsync(
        { sub: String(user._id), isTwoFactorPending: true },
        { expiresIn: '5m' },
      );
      return {
        requires2fa: true,
        tempToken,
      };
    }

    const payload: JwtPayload = {
      sub: String(user._id),
      username: user.username,
      email: user.email,
      role: user.role,
      planId: user.planId,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    return {
      access_token: accessToken,
      user: {
        id: String(user._id),
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }

  async googleLogin(token: string): Promise<AuthResponseDto> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedException('Invalid Google token');
      }

      let user = await this.userModel.findOne({ email: payload.email }).exec();
      if (!user) {
        const generatedPassword = await bcrypt.hash(
          Math.random().toString(36).slice(-10) + 'A1!',
          10,
        );
        user = await this.userModel.create({
          email: payload.email,
          username: payload.name || payload.email.split('@')[0],
          displayName: payload.name || payload.email,
          password: generatedPassword,
          role: 'user',
        });
      }

      if (user.isTwoFactorEnabled) {
        const tempToken = await this.jwtService.signAsync(
          { sub: String(user._id), isTwoFactorPending: true },
          { expiresIn: '5m' },
        );
        return {
          requires2fa: true,
          tempToken,
        };
      }

      const jwtPayload: JwtPayload = {
        sub: String(user._id),
        username: user.username,
        email: user.email,
        role: user.role,
        planId: user.planId,
      };

      return {
        access_token: await this.jwtService.signAsync(jwtPayload),
        user: {
          id: String(user._id),
          email: user.email,
          username: user.username,
          role: user.role,
        },
      };
    } catch (err: unknown) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  async authenticate2FA(
    tempToken: string,
    code: string,
  ): Promise<AuthResponseDto> {
    let payload: { sub: string; isTwoFactorPending?: boolean };
    try {
      payload = await this.jwtService.verifyAsync(tempToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired temporary token');
    }

    if (!payload.isTwoFactorPending) {
      throw new UnauthorizedException('Invalid token for 2FA authentication');
    }

    const user = await this.userModel.findById(payload.sub).exec();
    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('User or 2FA secret not found');
    }

    const isCodeValid = await otplib.verify({
      token: code,
      secret: user.twoFactorSecret,
    });
    if (!isCodeValid.valid) {
      throw new UnauthorizedException('Wrong authentication code');
    }

    const finalPayload: JwtPayload = {
      sub: String(user._id),
      username: user.username,
      email: user.email,
      role: user.role,
      planId: user.planId,
    };

    return {
      access_token: await this.jwtService.signAsync(finalPayload),
      user: {
        id: String(user._id),
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }

  async generate2FaSecret(userId: string): Promise<Generate2FaResponseDto> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const secret = otplib.generateSecret();
    const qrCodeUrl = otplib.generateURI({
      label: user.email,
      issuer: 'ng-console',
      secret,
    });

    await this.userModel.findByIdAndUpdate(userId, { twoFactorSecret: secret }).exec();
    return { secret, qrCodeUrl };
  }

  async turnOn2Fa(userId: string, code: string): Promise<{ success: boolean }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('User or 2FA secret not found');
    }

    const isCodeValid = await otplib.verify({
      token: code,
      secret: user.twoFactorSecret,
    });
    if (!isCodeValid.valid) {
      throw new UnauthorizedException('Wrong authentication code');
    }

    await this.userModel.findByIdAndUpdate(userId, { isTwoFactorEnabled: true }).exec();
    return { success: true };
  }

  async validateToken(token: string): Promise<TokenValidationResultDto> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      return {
        valid: true,
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      return { valid: false };
    }
  }
}
