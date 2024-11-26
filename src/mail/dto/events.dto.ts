import Mail from "nodemailer/lib/mailer";
import { Account } from "src/auth-system/accounts/entities/account.entity"

export class ConfirmationMailEventDto {
    account: Account;
    token: string;
    otp: number;

    constructor(account: Account, token: string, otp: number) {
        this.account = account;
        this.token = token;
        this.otp = otp;
    }
}

export class ResetPasswordMailEventDto {
    account: Account;
    token: string;

    constructor(account: Account, token: string) {
        this.account = account;
        this.token = token;
    }
}

export class FeeInvoiceCreatedEventDto {
    subject: string;
    parentName: string;
    parentMail: string;
    studentName: string;
    invoiceMonth: string;
    invoiceYear: string;
    currency: string;
    totalAmount: number;
    schoolName: string;

    attachments?: Mail.Attachment[];

    constructor(dto: Partial<FeeInvoiceCreatedEventDto>) {
        Object.assign(this, dto);
    }
}