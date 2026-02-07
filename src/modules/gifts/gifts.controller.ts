import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { GiftsService } from './gifts.service';
import { CreateGiftDto } from './dtos/create-gift.dto';

@Controller('gifts')
export class GiftsController {
  constructor(private readonly giftsService: GiftsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createGiftDto: CreateGiftDto) {
    try {
      return await this.giftsService.create(createGiftDto);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  @Get('by-event/:eventId')
  async findByEvent(
    @Param('eventId') eventId: string,
    @Query('userId') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('O parâmetro userId é obrigatório');
    }
    try {
      return await this.giftsService.findByEvent(eventId, userId);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }
}
