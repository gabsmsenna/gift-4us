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
  Req,
  UseGuards,
} from '@nestjs/common';
import { GiftsService } from './gifts.service';
import { CreateGiftDto } from './dtos/create-gift.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('gifts')
@UseGuards(JwtAuthGuard)
export class GiftsController {
  constructor(private readonly giftsService: GiftsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createGiftDto: CreateGiftDto, @Req() req,) {
    try {
      const userId = req.user?.id;
      return await this.giftsService.create(createGiftDto, userId);
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
