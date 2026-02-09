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
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dtos/create-event.dto';
import { DrawSecretFriendDto } from './dtos/draw-secret-friend.dto';
import { AddEventParticipantsDto } from './dtos/add-event-participants.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.eventsService.create(createEventDto, userId);
  }

  @Post('secret-friend-draw')
  @HttpCode(HttpStatus.CREATED)
  async drawSecretFriend(
    @Body() drawSecretFriendDto: DrawSecretFriendDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.eventsService.drawSecretFriend(drawSecretFriendDto, userId);
  }

  @Post('secret-friend-participants')
  @HttpCode(HttpStatus.CREATED)
  async addSecretFriendParticipants(
    @Body() addEventParticipantsDto: AddEventParticipantsDto,
    @CurrentUser('sub') ownerId: string,
  ) {
    return this.eventsService.addEventParticipants(
      addEventParticipantsDto,
      ownerId,
    );
  }

  @Get('user-events')
  async findUserEvents(@CurrentUser('sub') userId: string) {
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