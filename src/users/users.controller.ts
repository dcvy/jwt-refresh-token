import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRoleDto } from './dto/assign-role-dto';
import { AtGuard } from '../auth/guards/access-token.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { Permissions } from '../permissions/decorators/permissions.decorator';

@UseGuards(AtGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('VIEW_USER_LIST')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Post()
  @Permissions('CREATE_USER')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  @Permissions('UPDATE_USER')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @Permissions('DELETE_USER')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Post(':id/roles')
  assignRole(@Param('id') id: string, @Body() assignRoleDto: AssignRoleDto) {
    return this.usersService.assignRole(+id, assignRoleDto);
  }

  @Delete(':id/roles/:roleId')
  removeRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.usersService.removeRole(+id, +roleId);
  }
}
