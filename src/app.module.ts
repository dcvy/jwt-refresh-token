import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { AtGuard } from './auth/guards';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { UsersModule } from './users/users.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { I18nController } from './i18n/i18n.controller';
import {
  I18nModule,
  I18nJsonLoader,
  QueryResolver,
  AcceptLanguageResolver,
} from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loader: I18nJsonLoader,
      loaderOptions: {
        path: path.join('/app/i18n/locales'),
        watch: true,
      },
      resolvers: [new AcceptLanguageResolver(), new QueryResolver(['lang'])],
    }),
    PrismaModule,
    AuthModule,
    // To enable `configModule` for all routes
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // config `RateLimiting`
    ThrottlerModule.forRoot({
      ttl: parseInt(process.env.RATE_LIMIT_TIME_TO_LIVE),
      limit: parseInt(process.env.RATE_LIMIT_MAX_NUMBER_REQUEST),
    }),
    UsersModule,
    PermissionsModule,
    RolesModule,
  ],

  providers: [
    // To set `ATGuard` as global guard for all routes
    { provide: APP_GUARD, useClass: AtGuard },
    // To enable `RateLimit` for all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],

  controllers: [I18nController],
})
export class AppModule {}
