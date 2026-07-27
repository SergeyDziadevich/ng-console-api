import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { sub: string };
}

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('google-drive/auth')
  @UseGuards(AuthGuard)
  getGoogleDriveAuthUrl() {
    const url = this.integrationsService.getGoogleDriveAuthUrl();
    return { url };
  }

  @Post('google-drive/callback')
  @UseGuards(AuthGuard)
  async handleGoogleDriveCallback(
    @Body('code') code: string,
    @Req() req: RequestWithUser,
  ) {
    await this.integrationsService.handleGoogleDriveCallback(
      code,
      req.user.sub,
    );
    return { success: true };
  }

  @Post('google-drive/disconnect')
  @UseGuards(AuthGuard)
  async disconnectGoogleDrive(@Req() req: RequestWithUser) {
    await this.integrationsService.disconnectGoogleDrive(req.user.sub);
    return { success: true };
  }
}
