import { Controller, Get, Param, Post, Delete, Body, Req } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { GroupsService } from './groups.service';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: any;
}

class AssignRoleDto {
  @IsString()
  @IsNotEmpty()
  roleId!: string;
}

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  async findAll() {
    return this.groupsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Post(':id/members/:userId/roles')
  async assignRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = req.user as any || { id: 'admin' };
    return this.groupsService.assignRole(id, userId, dto.roleId, user.id);
  }

  @Delete(':id/members/:userId/roles/:roleId')
  async removeRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.groupsService.removeRole(id, userId, roleId);
  }
}
