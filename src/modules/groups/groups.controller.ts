import {
  Body,
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dtos/create-group.dto';
import { GroupListDto, GroupMemberDto } from './dtos/group-list.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) { }

  @Get()
  async findUserGroups(
    @CurrentUser('sub') userId: string,
  ): Promise<GroupListDto[]> {
    return this.groupsService.findUserGroups(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createGroupDto: CreateGroupDto, @CurrentUser('sub') userId: string) {
    return await this.groupsService.create(createGroupDto, userId);
  }

  @Get(':id')
  async getMembersGroup(
    @Param('id') id: string,
  ): Promise<GroupMemberDto[] | null> {
    return this.groupsService.getMembersGroup(id);
  }
}
