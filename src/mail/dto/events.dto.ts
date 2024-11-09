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