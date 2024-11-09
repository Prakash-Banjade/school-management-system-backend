import { Injectable, Logger, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { emailConfig, ITemplates } from './mail-service.config';
import { readFileSync } from 'fs';
import * as nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import { join } from 'path';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfirmationMailEventDto, ResetPasswordMailEventDto } from './dto/events.dto';

export enum MailEvents {
    CONFIRMATION = 'mail.confirmation',
    RESET_PASSWORD = 'mail.reset-password',
}

@Injectable()
export class MailService {
    private readonly loggerService: LoggerService;
    private readonly transport: Transporter<SMTPTransport.SentMessageInfo>;
    private readonly email: string;
    private readonly domain: string;
    private readonly templates: ITemplates;

    constructor(private readonly configService: ConfigService) {
        this.transport = createTransport(emailConfig);
        this.email = `"SMS Backend" <${emailConfig.auth.user}>`;
        this.domain = this.configService.get<string>('CLIENT_URL');
        this.loggerService = new Logger(MailService.name);

        this.templates = {
            confirmation: MailService.parseTemplate('email-verification-otp.hbs'),
            resetPassword: MailService.parseTemplate('reset-password.hbs'),
        };
    }

    private static parseTemplate<T>(
        templateName: string,
    ): Handlebars.TemplateDelegate<T> {
        const templateText = readFileSync(
            join(__dirname, 'templates', templateName),
            'utf-8',
        );
        return Handlebars.compile<T>(templateText, { strict: true });
    }

    public async sendEmail(
        to: string,
        subject: string,
        html: string,
    ): Promise<void> {
        const result = await this.transport.sendMail({
            from: this.email,
            to,
            subject,
            html,
        });

        const previewUrl = nodemailer.getTestMessageUrl(result);
        console.log(previewUrl)
    }

    @OnEvent(MailEvents.CONFIRMATION)
    public async sendConfirmationEmail(dto: ConfirmationMailEventDto) {
        const { email, firstName, lastName } = dto.account;
        const subject = 'Confirm your email';
        const html = this.templates.confirmation({
            name: firstName + ' ' + lastName,
            link: `${this.domain}/auth/confirm/${dto.token}`,
            otp: String(dto.otp),
        });
        this.sendEmail(email, subject, html);
    }

    @OnEvent(MailEvents.RESET_PASSWORD)
    public async sendResetPasswordLink(dto: ResetPasswordMailEventDto) {
        const { email, firstName, lastName } = dto.account;
        const subject = 'Reset your password';
        const html = this.templates.resetPassword({
            name: firstName + ' ' + lastName,
            resetLink: `${this.domain}/auth/reset-password/${dto.token}`,
        });
        this.sendEmail(
            email,
            subject,
            html,
        );
    }
}