import {
  Body,
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  BadRequestException,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dtos/create-group.dto';
import { GroupListDto, GroupMemberDto } from './dtos/group-list.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  async findUserGroups(
    @Req() req,
  ): Promise<GroupListDto[]> {
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestException('O parâmetro userId é obrigatório');
    }
    
    return this.groupsService.findUserGroups(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createGroupDto: CreateGroupDto, @Req() req) {
    try {
      const userId = req.user?.id
      return await this.groupsService.create(createGroupDto, userId);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  @Get(':id')
  async getMembersGroup(
    @Param('id') id: string,
  ): Promise<GroupMemberDto[] | null> {
    return this.groupsService.getMembersGroup(id);
  }
}
