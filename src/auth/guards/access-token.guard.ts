import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';

@Injectable()
export class AtGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    @Inject(forwardRef(() => JwtService)) private jwtService: JwtService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride('is-public', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const canActivate = await super.canActivate(context);
    if (!canActivate) return false;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader) throw new UnauthorizedException('Missing access token');

    const accessToken = authHeader.split(' ')[1];
    if (!accessToken) throw new UnauthorizedException('Invalid token format');

    const decoded = this.jwtService.decode(accessToken) as {
      sub: number;
      username: string;
    };
    if (!decoded?.sub || !decoded?.username)
      throw new UnauthorizedException('Invalid token payload');

    const storedToken = await this.prisma.accessToken.findFirst({
      where: { userId: decoded.sub, token: accessToken, revoked: false },
    });

    if (!storedToken)
      throw new UnauthorizedException('Access token is revoked or invalid');

    return true;
  }
}
