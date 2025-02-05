import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { AuthSigninDto, AuthSignupDto } from './../auth/dto';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendEmailWelcome(userName: string, email: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to Auth!',
      template: './templates/confirmation.hbs',
      context: {
        name: userName,
      },
    });
  }
}
