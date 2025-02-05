import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { Permissions } from '../permissions/decorators/permissions.decorator';

@Controller('roles')
@UseGuards(PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // Lấy danh sách tất cả vai trò kèm quyền
  @Get()
  @Permissions('VIEW_ROLE_LIST')
  async getAllRoles() {
    return this.rolesService.getAllRoles();
  }

  // Lấy thông tin một vai trò theo ID
  @Get(':id')
  async getRoleById(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.getRoleById(id);
  }

  // Tạo vai trò mới
  @Post()
  @Permissions('CREATE_ROLE')
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.createRole(createRoleDto);
  }

  // Cập nhật vai trò
  @Patch(':id')
  @Permissions('UPDATE_ROLE')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(id, updateRoleDto);
  }

  // Xóa vai trò
  @Delete(':id')
  @Permissions('DELETE_ROLE')
  async deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.deleteRole(id);
  }

  // Gán quyền cho vai trò
  @Post(':id/permissions')
  async assignPermissions(
    @Param('id', ParseIntPipe) roleId: number,
    @Body('permissionIds') permissionIds: number[],
  ) {
    return this.rolesService.assignPermissionsToRole(roleId, permissionIds);
  }
}
