import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class AtGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    @Inject(forwardRef(() => AuthService)) private authService: AuthService,
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

    const decoded = this.authService.decodeToken(accessToken);
    if (!decoded?.sub) throw new UnauthorizedException('Invalid token payload');

    const isValid = await this.authService.validateAccessToken(
      decoded.sub,
      accessToken,
    );
    if (!isValid) throw new UnauthorizedException('Access token revoked');

    request.user = decoded;
    return true;
  }
}
