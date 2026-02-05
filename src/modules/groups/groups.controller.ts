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
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dtos/create-group.dto';
import { GroupListDto, GroupMemberDto } from './dtos/group-list.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  async findUserGroups(
    @Query('userId') userId: string,
  ): Promise<GroupListDto[]> {
    if (!userId) {
      throw new BadRequestException('O parâmetro userId é obrigatório');
    }
    return this.groupsService.findUserGroups(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createGroupDto: CreateGroupDto) {
    try {
      return await this.groupsService.create(createGroupDto);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  @Get(':id')
  async getMembersGroup(@Param('id') id: string): Promise<GroupMemberDto[] | null> {
    return this.groupsService.getMembersGroup(id);
  }
}
