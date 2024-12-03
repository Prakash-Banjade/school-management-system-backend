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
import { ConfirmationMailEventDto, FeeInvoiceCreatedEventDto, ResetPasswordMailEventDto, UserCredentialsEventDto } from './dto/events.dto';
import Mail from 'nodemailer/lib/mailer';

export enum MailEvents {
    CONFIRMATION = 'mail.confirmation',
    USER_CREDENTIALS = 'mail.user-credentials',
    RESET_PASSWORD = 'mail.reset-password',
    FEE_INVOICE_CREATED = 'fee-invoice:created'
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
            invoiceCreated: MailService.parseTemplate('fee-system/fee-invoice-created.hbs'),
            userCredentials: MailService.parseTemplate('sendUserCredentials.hbs'),
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
        attachments?: Mail.Attachment[]
    ): Promise<void> {
        const result = await this.transport.sendMail({
            from: this.email,
            to,
            subject,
            html,
            attachments,
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

    @OnEvent(MailEvents.USER_CREDENTIALS)
    public async sendUserCredentials(dto: UserCredentialsEventDto) {
        const subject = 'SMS Credentials';
        const html = this.templates.userCredentials(dto);
        this.sendEmail(dto.email, subject, html);
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

    @OnEvent(MailEvents.FEE_INVOICE_CREATED)
    public async sendFeeInvoiceCreatedMail(dto: FeeInvoiceCreatedEventDto) {
        const { parentMail, subject } = dto;
        const html = this.templates.invoiceCreated(dto);

        this.sendEmail(
            parentMail,
            subject,
            html,
            dto.attachments,
        );
    }
}