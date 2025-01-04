import { IsDefined, IsEmail } from "class-validator";

export class AuthVerifyDto {
    @IsEmail()
    email!: string;

    @IsDefined()
    authenticationResponse!: any;
}