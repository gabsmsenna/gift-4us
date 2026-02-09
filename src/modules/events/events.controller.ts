import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dtos/create-event.dto';
import { DrawSecretFriendDto } from './dtos/draw-secret-friend.dto';
import { AddEventParticipantsDto } from './dtos/add-event-participants.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createEventDto: CreateEventDto, @Req() req) {
    try {
      const userId = req.user?.id;

      return await this.eventsService.create(createEventDto, userId);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  @Post('secret-friend-draw')
  @HttpCode(HttpStatus.CREATED)
  async drawSecretFriend(
    @Body() drawSecretFriendDto: DrawSecretFriendDto,
    @Req() req,
  ) {
    try {
      const userId = req.user?.id;

      return await this.eventsService.drawSecretFriend(
        drawSecretFriendDto,
        userId,
      );
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  @Post('secret-friend-participants')
  @HttpCode(HttpStatus.CREATED)
  async addSecretFriendParticipants(
    @Body() addEventParticipantsDto: AddEventParticipantsDto,
    @Req() req,
  ) {
    try {
      const ownerId = req.user?.id;

      return await this.eventsService.addEventParticipants({
        ...addEventParticipantsDto,
      }, ownerId);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  @Get('user-events')
  async findUserEvents(@Req() req) {
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestException('Usuário não encontrado na requisição autenticada');
    }

    return this.eventsService.findUserEvents(userId);
  }

  @Get('group-events')
  async findGroupsEvents(@Query('groupId') groupId: string) {
    if (!groupId) {
      throw new BadRequestException('O parâmetro groupId é obrigatório');
    }
    return this.eventsService.findGroupEvents(groupId);
  }
}
