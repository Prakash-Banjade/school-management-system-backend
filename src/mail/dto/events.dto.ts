import Mail from "nodemailer/lib/mailer";

export class ConfirmationMailEventDto {
    receiverEmail: string;
    receiverName: string;
    token: string;
    otp: number;
    expirationMin: number;

    constructor(dto: ConfirmationMailEventDto) {
        Object.assign(this, dto);
    }
}

export class ResetPasswordMailEventDto {
    receiverEmail: string;
    receiverName: string;
    token: string;

    constructor(dto: ResetPasswordMailEventDto) {
        Object.assign(this, dto);
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

export class UserCredentialsEventDto {
    email: string;
    password: string;
    username: string;

    constructor(dto: UserCredentialsEventDto) {
        Object.assign(this, dto);
    }
}