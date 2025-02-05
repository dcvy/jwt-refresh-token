import {
  ForbiddenException,
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthSigninDto, AuthSignupDto } from './dto';
import * as argon2 from 'argon2';
import { Tokens } from './types';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { ConfigService } from '@nestjs/config';
import { MailService } from './../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private mailService: MailService,
  ) {}

  async signup(dto: AuthSignupDto): Promise<Tokens> {
    const password = await this.generateArgonHash(dto.password);

    try {
      const newUser = await this.prisma.user.create({
        data: {
          username: dto.username,
          email: dto.email,
          password,
        },
      });

      const tokens: Tokens = await this.generateTokens(
        newUser.id,
        newUser.username,
      );
      await this.saveTokensToDb(newUser.id, tokens);
      return tokens;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Duplicate Username');
        }
      }
      throw error;
    }
  }

  async signin(dto: AuthSigninDto): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (!user)
      throw new UnauthorizedException('Username or password incorrect');

    const passwordMatches = await argon2.verify(user.password, dto.password);
    if (!passwordMatches)
      throw new UnauthorizedException('Username or password incorrect');

    const tokens: Tokens = await this.generateTokens(user.id, user.username);
    await this.saveTokensToDb(user.id, tokens);
    //await this.mailService.sendEmailWelcome(user.username, user.email);
    return tokens;
  }

  async logout(userId: number, refreshToken: string) {
    const storedRefreshToken = await this.prisma.refreshToken.findFirst({
      where: { userId, token: refreshToken },
    });

    if (!storedRefreshToken) {
      throw new ForbiddenException('Invalid Refresh Token');
    }

    await this.prisma.accessToken.deleteMany({ where: { userId } });
    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    return { message: 'Logged out successfully' };
  }

  async refreshTokens(userId: number, refreshToken: string): Promise<Tokens> {
    const storedRefreshToken = await this.prisma.refreshToken.findFirst({
      where: { userId, token: refreshToken },
    });
    if (!storedRefreshToken)
      throw new UnauthorizedException('Username or password incorrect');

    // Giải mã refreshToken để lấy thời gian hết hạn (exp)
    const decoded = this.jwtService.decode(refreshToken) as { exp: number };

    if (!decoded || !decoded.exp) {
      throw new UnauthorizedException('Invalid refresh token format');
    }

    // Kiểm tra token đã hết hạn chưa
    const currentTime = Math.floor(Date.now() / 1000); // Convert to seconds
    if (decoded.exp < currentTime) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Lấy thông tin user
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const refreshTokenMatches = storedRefreshToken.token === refreshToken;
    if (!refreshTokenMatches)
      throw new UnauthorizedException('Username or password incorrect');

    const tokens: Tokens = await this.generateTokens(user.id, user.username);
    await this.saveTokensToDb(userId, tokens);
    return tokens;
  }

  async validateAccessToken(
    userId: number,
    accessToken: string,
  ): Promise<boolean> {
    const storedToken = await this.prisma.accessToken.findFirst({
      where: { userId, token: accessToken },
    });
    return !!storedToken;
  }

  async generateArgonHash(data: string): Promise<string> {
    return await argon2.hash(data);
  }

  async saveTokensToDb(userId: number, tokens: Tokens) {
    await Promise.all([
      this.prisma.accessToken.create({
        data: {
          token: tokens.access_token,
          userId,
        },
      }),
      this.prisma.refreshToken.create({
        data: {
          token: tokens.refresh_token,
          userId,
        },
      }),
    ]);
  }

  async generateTokens(userId: number, username: string): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, username },
        {
          secret: this.config.get('JWT_ACCESS_TOKEN_SECRET_KEY'),
          expiresIn: Number(this.config.get('ACCESS_TOKEN_LIFE_TIME')),
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, username },
        {
          secret: this.config.get('JWT_REFRESH_TOKEN_SECRET_KEY'),
          expiresIn: Number(this.config.get('REFRESH_TOKEN_LIFE_TIME')),
        },
      ),
    ]);

    return { access_token: accessToken, refresh_token: refreshToken };
  }
}
