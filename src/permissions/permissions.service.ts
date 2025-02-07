import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async create(createPermissionDto: CreatePermissionDto) {
    return this.prisma.permission.create({
      data: createPermissionDto,
    });
  }

  async findAll() {
    return this.prisma.permission.findMany();
  }

  async findOne(id: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });
    if (!permission) throw new NotFoundException('Permission not found');
    return permission;
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto) {
    return this.prisma.permission.update({
      where: { id },
      data: updatePermissionDto,
    });
  }

  async remove(id: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    const isAssignedToSuperAdmin = await this.prisma.rolePermission.findFirst({
      where: {
        permissionId: id,
        role: {
          isSuperAdmin: true,
        },
      },
    });

    if (isAssignedToSuperAdmin) {
      await this.prisma.rolePermission.deleteMany({
        where: {
          permissionId: id,
          role: {
            isSuperAdmin: false,
          },
        },
      });

      return {
        message:
          'Permission is assigned to Super Admin and cannot be deleted, but removed from other roles.',
      };
    }

    const isUsedByAnyRole = await this.prisma.rolePermission.findFirst({
      where: { permissionId: id },
    });

    if (isUsedByAnyRole) {
      throw new ForbiddenException(
        'Cannot delete permission as it is still assigned to other roles.',
      );
    }

    return this.prisma.permission.delete({ where: { id } });
  }
}
