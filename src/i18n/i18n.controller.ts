import { Controller, Get, Query } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Public } from 'src/auth/decorators';

@Controller('i18n')
export class I18nController {
  constructor(private readonly i18n: I18nService) {}

  @Public()
  @Get('message')
  async getMessage(@Query('key') key: string, @Query('lang') lang?: string) {
    const message = await this.i18n.translate(key, { lang });
    return { message };
  }
}
