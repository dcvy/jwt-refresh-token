import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  // Lấy danh sách tất cả vai trò kèm theo quyền
  async getAllRoles() {
    return this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true, // Lấy thông tin quyền
          },
        },
      },
    });
  }

  // Lấy vai trò theo ID kèm theo quyền
  async getRoleById(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  // Tạo vai trò mới
  async createRole(dto: CreateRoleDto) {
    return this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        rolePermissions: dto.permissionIds
          ? {
              create: dto.permissionIds.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
    });
  }

  // Cập nhật vai trò
  async updateRole(id: number, dto: UpdateRoleDto) {
    const existingRole = await this.prisma.role.findUnique({ where: { id } });
    if (!existingRole) throw new NotFoundException('Role not found');

    // Không cho phép sửa vai trò Super Admin
    if (existingRole.isSuperAdmin) {
      throw new ForbiddenException('Cannot modify Super Admin role');
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        rolePermissions: dto.permissionIds
          ? {
              deleteMany: {},
              create: dto.permissionIds.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
    });
  }

  // Xóa vai trò (không cho phép xóa Super Admin)
  async deleteRole(id: number) {
    const existingRole = await this.prisma.role.findUnique({ where: { id } });
    if (!existingRole) throw new NotFoundException('Role not found');

    if (existingRole.isSuperAdmin) {
      throw new ForbiddenException('Cannot delete Super Admin role');
    }

    return this.prisma.role.delete({ where: { id } });
  }

  // Gán quyền cho vai trò
  async assignPermissionsToRole(roleId: number, permissionIds: number[]) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    if (role.isSuperAdmin) {
      throw new ForbiddenException('Cannot modify Super Admin permissions');
    }

    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        rolePermissions: {
          deleteMany: {}, // Xóa tất cả quyền cũ trước khi thêm mới
          create: permissionIds.map((permissionId) => ({
            permissionId,
          })),
        },
      },
    });
  }
}
