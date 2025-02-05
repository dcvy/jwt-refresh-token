import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthSigninDto, AuthSignupDto } from './dto';
import { Tokens } from './types';
import { RtGuard } from 'src/auth/guards';
import { getCurrentUser, getCurrentUserId, Public } from 'src/auth/decorators';
import * as jwt from 'jsonwebtoken';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() dto: AuthSignupDto): Promise<Tokens> {
    return this.authService.signup(dto);
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  signIn(@Body() dto: AuthSigninDto): Promise<Tokens> {
    return this.authService.signin(dto);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) {
      throw new Error('Refresh token is required');
    }

    let decodedToken: any;
    try {
      decodedToken = jwt.decode(refreshToken);
    } catch (error) {
      throw new Error('Invalid Refresh Token');
    }

    if (!decodedToken || !decodedToken.sub) {
      throw new Error('Invalid Refresh Token');
    }

    const userId = decodedToken.sub;
    return this.authService.logout(userId, refreshToken);
  }

  @Public()
  @UseGuards(RtGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @getCurrentUserId() userId: number,
    @getCurrentUser('refreshToken') refreshToken: string,
  ) {
    return this.authService.refreshTokens(userId, refreshToken);
  }
}
