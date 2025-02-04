import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { AuthSigninDto, AuthSignupDto } from './../auth/dto';

@Injectable()
export class MailService {
    constructor(private mailerService: MailerService) { }

    async sendUserConfirmation(userName: string, email: string, accessToken: string, refreshToken: string) {
        const aT = `${accessToken}`;
        const rT = `${refreshToken}`;

        await this.mailerService.sendMail({
            to: email,
            subject: 'Welcome to Auth! Here is your accessToken and refreshToken',
            template: './confirmation',
            context: {
                name: userName,
                aT,
                rT
            },
        });
    }
}
