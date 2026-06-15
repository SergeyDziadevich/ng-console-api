import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AuthGuard } from '../auth/auth.guard';
import { JwtPayload } from '../auth/models/auth.interface';

@Controller('tickets')
@UseGuards(AuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  findAll() {
    return this.ticketsService.findAll();
  }

  @Get('epics')
  findAllEpics() {
    return this.ticketsService.findAllEpics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    return this.ticketsService.update(+id, updateTicketDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(+id);
  }

  @Post(':id/comments')
  addComment(
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: { user?: JwtPayload },
  ) {
    if (req.user) {
      createCommentDto.authorId =
        req.user.displayName || req.user.username || 'Unknown User';
    }
    return this.ticketsService.addComment(+id, createCommentDto);
  }
}
