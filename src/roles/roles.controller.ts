import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // Lấy danh sách tất cả vai trò kèm quyền
  @Get()
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
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.createRole(createRoleDto);
  }

  // Cập nhật vai trò
  @Patch(':id')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(id, updateRoleDto);
  }

  // Xóa vai trò
  @Delete(':id')
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
