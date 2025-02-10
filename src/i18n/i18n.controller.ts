import { Controller, Get, Put, Query, Body } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Public } from 'src/auth/decorators';
import * as fs from 'fs';
import * as path from 'path';

@Controller('i18n')
export class I18nController {
  constructor(private readonly i18n: I18nService) {}

  @Public()
  @Get('message')
  async getMessage(
    @Query('key') key: string,
    @Query('lang') lang: string = 'en',
  ) {
    const filePath = path.join('/app/i18n/locales', lang, 'errors.json');

    if (!fs.existsSync(filePath)) {
      return { error: 'Language file not found', filePath };
    }

    const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const message = fileContent[key] || 'Key not found';

    return { message };
  }

  @Public()
  @Put('update-content')
  async updateContent(
    @Query('lang') lang: string,
    @Query('key') key: string,
    @Body('value') value: string,
  ) {
    const filePath = path.join('/app/i18n/locales', lang, 'errors.json');

    if (!fs.existsSync(filePath)) {
      return { error: 'Language file not found', filePath };
    }

    const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (!(key in fileContent)) {
      return { error: 'Key not found' };
    }

    fileContent[key] = value;
    fs.writeFileSync(filePath, JSON.stringify(fileContent, null, 2));

    return { success: true, message: 'Key content updated successfully' };
  }

  @Public()
  @Put('rename-key')
  async renameKey(
    @Query('lang') lang: string,
    @Query('oldKey') oldKey: string,
    @Query('newKey') newKey: string,
  ) {
    const filePath = path.join('/app/i18n/locales', lang, 'errors.json');

    if (!fs.existsSync(filePath)) {
      return { error: 'Language file not found', filePath };
    }

    const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (!(oldKey in fileContent)) {
      return { error: 'Old key not found' };
    }

    fileContent[newKey] = fileContent[oldKey];
    delete fileContent[oldKey];

    fs.writeFileSync(filePath, JSON.stringify(fileContent, null, 2));

    return { success: true, message: 'Key renamed successfully' };
  }
}
