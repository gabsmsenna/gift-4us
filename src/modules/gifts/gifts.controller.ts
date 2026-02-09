import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GiftsService } from './gifts.service';
import { CreateGiftDto } from './dtos/create-gift.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('gifts')
@UseGuards(JwtAuthGuard)
export class GiftsController {
  constructor(private readonly giftsService: GiftsService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createGiftDto: CreateGiftDto, @CurrentUser('sub') userId: string) {
    return await this.giftsService.create(createGiftDto, userId);
  }

  @Get('by-event/:eventId')
  async findByEvent(
    @Param('eventId') eventId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return await this.giftsService.findByEvent(eventId, userId);
  }
}
