import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { EventSuppliesService } from '../services/event-supplies.service';
import { CreateEventSupplyDto } from '../dtos/create-event-supply.dto';
import { UpdateEventSupplyDto } from '../dtos/update-event-supply.dto';

@Controller('events')
export class EventSuppliesController {
  constructor(private readonly eventSuppliesService: EventSuppliesService) {}

  @Post(':eventId/supplies')
  @HttpCode(HttpStatus.CREATED)
  async createSupply(
    @Param('eventId') eventId: string,
    @Query('userId') userId: string,
    @Body() createEventSupplyDto: CreateEventSupplyDto,
  ) {
    return await this.eventSuppliesService.createSupply(
      eventId,
      userId,
      createEventSupplyDto,
    );
  }

  @Get(':eventId/supplies')
  @HttpCode(HttpStatus.OK)
  async getEventSupplies(@Param('eventId') eventId: string) {
    return await this.eventSuppliesService.getEventSupplies(eventId);
  }

  @Patch(':eventId/supplies/:supplyId')
  @HttpCode(HttpStatus.OK)
  async updateSupply(
    @Param('supplyId') supplyId: string,
    @Query('userId') userId: string,
    @Body() updateEventSupplyDto: UpdateEventSupplyDto,
  ) {
    return await this.eventSuppliesService.updateSupply(
      supplyId,
      userId,
      updateEventSupplyDto,
    );
  }

  @Delete(':eventId/supplies/:supplyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSupply(
    @Param('supplyId') supplyId: string,
    @Query('userId') userId: string,
  ) {
    await this.eventSuppliesService.deleteSupply(supplyId, userId);
  }
}
