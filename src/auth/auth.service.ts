import { ForbiddenException, Injectable } from '@nestjs/common';
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
    private mailService: MailService
  ) { }

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

      await this.updateRefreshTokenHash(newUser.id, tokens.refresh_token);
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

    if (!user) throw new ForbiddenException('Access Denied');

    const passwordMatches: boolean = await argon2.verify(user.password, dto.password);
    if (!passwordMatches) throw new ForbiddenException('Access Denied');

    const tokens: Tokens = await this.generateTokens(user.id, user.username);
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);
    await this.mailService.sendUserConfirmation(user.username, user.email, tokens.access_token, tokens.refresh_token);
    return tokens;
  }

  async logout(userId: number) {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        hashedRT: {
          not: null,
        },
      },
      data: {
        hashedRT: null,
      },
    });
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || !user.hashedRT) throw new ForbiddenException('Access Denied');

    const refreshTokenMatches = await argon2.verify(
      user.hashedRT,
      refreshToken,
    );

    if (!refreshTokenMatches) throw new ForbiddenException('Access Denied');

    const tokens: Tokens = await this.generateTokens(user.id, user.username);
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);
    return tokens;
  }


  async generateArgonHash(data: string): Promise<string> {
    return await argon2.hash(data);
  }

  async updateRefreshTokenHash(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    const hash = await this.generateArgonHash(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRT: hash },
    });
  }

  async generateTokens(userId: number, username: string): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          username,
        },
        {
          secret: this.config.get('JWT_ACCESS_TOKEN_SECRET_KEY'),
          expiresIn: this.config.get('ACCESS_TOKEN_LIFE_TIME') * 60,
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          username,
        },
        {
          secret: this.config.get('JWT_REFRESH_TOKEN_SECRET_KEY'),
          expiresIn: this.config.get('REFRESH_TOKEN_LIFE_TIME') * 24 * 60 * 60,
        },
      ),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}
