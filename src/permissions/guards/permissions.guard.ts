import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private i18n: I18nService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id || !user.username) {
      throw new ForbiddenException(
        await this.i18n.translate('errors.unauthorized'),
      );
    }

    const userPermissions = await this.prisma.rolePermission.findMany({
      where: {
        role: {
          userRoles: {
            some: {
              userId: user.id, // Chỉ lấy quyền của user hiện tại
            },
          },
        },
      },
      select: {
        permission: {
          select: {
            key: true,
          },
        },
      },
    });

    const userPermissionKeys = new Set(
      userPermissions.map((rp) => rp.permission.key),
    );

    const hasPermission = requiredPermissions.every((permission) =>
      userPermissionKeys.has(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        await this.i18n.translate('errors.forbidden'),
      );
    }

    return true;
  }
}
