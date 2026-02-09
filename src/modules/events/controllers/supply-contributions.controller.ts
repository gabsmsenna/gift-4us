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
} from '@nestjs/common';
import { EventSuppliesService } from '../services/event-supplies.service';
import { CreateSupplyContributionDto } from '../dtos/create-supply-contribution.dto';
import { UpdateSupplyContributionDto } from '../dtos/update-supply-contribution.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller()
export class SupplyContributionsController {
  constructor(private readonly eventSuppliesService: EventSuppliesService) { }

  @Post('supplies/:supplyId/contributions')
  @HttpCode(HttpStatus.CREATED)
  async createContribution(
    @Param('supplyId') supplyId: string,
    @CurrentUser('sub') userId: string,
    @Body() createSupplyContributionDto: CreateSupplyContributionDto,
  ) {
    return await this.eventSuppliesService.createContribution(
      supplyId,
      userId,
      createSupplyContributionDto,
    );
  }

  @Get('supplies/:supplyId/contributions')
  @HttpCode(HttpStatus.OK)
  async getSupplyContributions(@Param('supplyId') supplyId: string) {
    return await this.eventSuppliesService.getSupplyContributions(supplyId);
  }

  @Patch('contributions/:contributionId')
  @HttpCode(HttpStatus.OK)
  async updateContribution(
    @Param('contributionId') contributionId: string,
    @CurrentUser('sub') userId: string,
    @Body() updateSupplyContributionDto: UpdateSupplyContributionDto,
  ) {
    return await this.eventSuppliesService.updateContribution(
      contributionId,
      userId,
      updateSupplyContributionDto,
    );
  }

  @Delete('contributions/:contributionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteContribution(
    @Param('contributionId') contributionId: string,
    @CurrentUser('sub') userId: string,
  ) {
    await this.eventSuppliesService.deleteContribution(contributionId, userId);
  }
}
