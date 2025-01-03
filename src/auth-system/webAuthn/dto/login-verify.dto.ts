import { IsDefined, IsEmail } from "class-validator";

export class LoginVerifyDto {
    @IsEmail()
    email!: string;

    @IsDefined()
    authenticationResponse!: any;
}