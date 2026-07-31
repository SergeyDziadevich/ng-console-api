import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Query,
  ForbiddenException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response, Request } from 'express';
import { DocumentsService } from './documents.service';
import { AuthGuard } from '../auth/auth.guard';
import { JwtPayload } from '../auth/models/auth.interface';
import { Role } from '../users/enums/role.enum';

interface RequestWithUser extends Request {
  user: JwtPayload;
}

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: '.(doc|docx|pdf|img|png)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    return this.documentsService.uploadFile(file, req.user.sub);
  }

  @Post('generate')
  @UseGuards(AuthGuard)
  async generateDocument(
    @Body() dto: import('./dto/generate-document.dto').GenerateDocumentDto,
    @Req() req: RequestWithUser,
  ) {
    return this.documentsService.generateDocument(
      dto.templateType,
      dto.data,
      req.user.sub,
    );
  }

  @Get()
  @UseGuards(AuthGuard)
  async getDocuments(
    @Req() req: RequestWithUser,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    return this.documentsService.getDocuments(
      req.user.sub,
      req.user.role,
      pageNum,
      limitNum,
    );
  }

  @Get('external/:token')
  async getExternalDocument(@Param('token') token: string) {
    const document =
      await this.documentsService.getDocumentByExternalToken(token);
    // Don't leak too much info, just return what's necessary to show the doc
    return {
      _id: document._id,
      filename: document.filename,
      partyASignatureName: document.partyASignatureName,
    };
  }

  @Get('external/:token/download')
  async downloadExternalDocument(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const document =
      await this.documentsService.getDocumentByExternalToken(token);
    const stream = this.documentsService.getDownloadStream(document.storageKey);

    res.set({
      'Content-Type': document.mimeType,
      'Content-Disposition': `attachment; filename="${document.filename}"`,
    });

    stream.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.status(500).send('Error streaming file');
      }
    });

    stream.pipe(res);
  }

  @Post('external/:token/sign')
  async signExternalDocument(
    @Param('token') token: string,
    @Body('signatureName') signatureName: string,
  ) {
    if (!signatureName) {
      throw new ForbiddenException('Signature name is required');
    }
    const document = await this.documentsService.signExternal(
      token,
      signatureName,
    );
    return { success: true, message: 'Document fully signed' };
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async downloadDocument(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const document = await this.documentsService.getDocumentById(id);

    if (
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      document.uploadedBy.toString() !== req.user.sub &&
      req.user.role !== Role.Admin &&
      req.user.role !== Role.Moderator
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this document.',
      );
    }

    const stream = this.documentsService.getDownloadStream(document.storageKey);

    res.set({
      'Content-Type': document.mimeType,
      'Content-Disposition': `attachment; filename="${document.filename}"`,
    });

    stream.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.status(500).send('Error streaming file');
      }
    });

    stream.pipe(res);
  }

  @Post(':id/sign')
  @UseGuards(AuthGuard)
  async signDocument(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body('signatureImage') signatureImage?: string,
  ) {
    return this.documentsService.signDocument(
      id,
      req.user.sub,
      req.user.displayName || req.user.username || 'User',
      req.user.role,
      signatureImage,
    );
  }

  @Post(':id/invite')
  @UseGuards(AuthGuard)
  async inviteToSign(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body('email') externalEmail: string,
  ) {
    if (!externalEmail) {
      throw new ForbiddenException('External email is required');
    }
    await this.documentsService.inviteToSign(id, req.user.sub, externalEmail);
    return { success: true, message: 'Invitation sent' };
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteDocument(@Param('id') id: string, @Req() req: RequestWithUser) {
    const document = await this.documentsService.getDocumentById(id);

    // Allow if user is owner OR user is Admin/Moderator
    if (
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      document.uploadedBy.toString() !== req.user.sub &&
      req.user.role !== Role.Admin &&
      req.user.role !== Role.Moderator
    ) {
      throw new ForbiddenException(
        'You do not have permission to delete this document.',
      );
    }

    return this.documentsService.deleteDocument(id, req.user.sub);
  }

  @Post(':id/share')
  @UseGuards(AuthGuard)
  async shareDocument(@Param('id') id: string, @Req() req: RequestWithUser) {
    const token = await this.documentsService.generateShareToken(
      id,
      req.user.sub,
      req.user.role,
    );
    return { token };
  }

  @Get('shared/:token')
  async downloadSharedDocument(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const document = await this.documentsService.getDocumentByShareToken(token);
    const stream = this.documentsService.getDownloadStream(document.storageKey);

    res.set({
      'Content-Type': document.mimeType,
      'Content-Disposition': `attachment; filename="${document.filename}"`,
    });

    stream.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.status(500).send('Error streaming file');
      }
    });

    stream.pipe(res);
  }

  @Post(':id/sync/google-drive')
  @UseGuards(AuthGuard)
  async syncToGoogleDrive(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    const webViewLink = await this.documentsService.syncToGoogleDrive(
      id,
      req.user.sub,
    );
    return { success: true, webViewLink };
  }
}
