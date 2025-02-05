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
    // Kiểm tra xem quyền này có đang được gán cho vai trò Super Admin không
    const isAssignedToSuperAdmin = await this.prisma.rolePermission.findFirst({
      where: {
        permissionId: id,
        role: {
          isSuperAdmin: true, // Chỉ cần kiểm tra isSuperAdmin
        },
      },
    });

    if (isAssignedToSuperAdmin) {
      throw new ForbiddenException(
        'Cannot remove a permission assigned to Super Admin',
      );
    }

    return this.prisma.permission.delete({ where: { id } });
  }
}
