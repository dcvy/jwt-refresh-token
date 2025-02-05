import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRoleDto } from './dto/assign-role-dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({ include: { userRoles: true } });
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });
  }

  async create(data: CreateUserDto) {
    return this.prisma.user.create({ data });
  }

  async update(id: number, data: UpdateUserDto) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) throw new NotFoundException('User not found');

    // Kiểm tra nếu người dùng là Super Admin duy nhất
    const superAdmins = await this.prisma.userRole.findMany({
      where: { role: { isSuperAdmin: true } },
    });

    if (superAdmins.length === 1 && superAdmins[0].userId === id) {
      throw new ForbiddenException('Cannot delete the last Super Admin');
    }

    return this.prisma.user.delete({ where: { id } });
  }

  async assignRole(userId: number, data: AssignRoleDto) {
    return this.prisma.userRole.create({
      data: { userId, roleId: data.roleId },
    });
  }

  async removeRole(userId: number, roleId: number) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });

    if (role?.isSuperAdmin) {
      throw new ForbiddenException('Cannot remove Super Admin role');
    }

    return this.prisma.userRole.deleteMany({
      where: { userId, roleId },
    });
  }
}
