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
  UseGuards,
  Req,
  Request,
} from '@nestjs/common';
import { EventSuppliesService } from '../services/event-supplies.service';
import { CreateEventSupplyDto } from '../dtos/create-event-supply.dto';
import { UpdateEventSupplyDto } from '../dtos/update-event-supply.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventSuppliesController {
  constructor(private readonly eventSuppliesService: EventSuppliesService) { }

  @Post(':eventId/supplies')
  @HttpCode(HttpStatus.CREATED)
  async createSupply(
    @Param('eventId') eventId: string,
    @Body() createEventSupplyDto: CreateEventSupplyDto,
    @CurrentUser('sub') userId: string,
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
    @CurrentUser('sub') userId: string,
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
    @CurrentUser('sub') userId: string,
  ) {
    await this.eventSuppliesService.deleteSupply(supplyId, userId);
  }
}
