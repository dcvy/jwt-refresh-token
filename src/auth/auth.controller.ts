import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Headers
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthSigninDto, AuthSignupDto } from './dto';
import { Tokens } from './types';
import { RtGuard } from 'src/auth/guards';
import { getCurrentUser, getCurrentUserId, Public } from 'src/auth/decorators';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

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

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @getCurrentUserId() userId: number,
    @Headers('authorization') authorization: string,
  ) {
    const accessToken = authorization?.split(' ')[1];

    if (!accessToken) {
      throw new Error('Access token is required');
    }

    return this.authService.logout(userId, accessToken);
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
