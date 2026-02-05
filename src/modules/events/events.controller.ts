import {
  Body,
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dtos/create-event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createEventDto: CreateEventDto) {
    try {
      return await this.eventsService.create(createEventDto);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  @Get('user-events')
  async findUserEvents(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('O parâmetro userId é obrigatório');
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
