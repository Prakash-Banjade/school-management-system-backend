import { IsEmail } from "class-validator";

export class LoginChallengeDto {
    @IsEmail()
    email!: string;
}