import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
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
}
