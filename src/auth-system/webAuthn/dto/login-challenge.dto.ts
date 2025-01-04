import { IsEmail, IsEnum, IsOptional } from "class-validator";
import { EPasskeyChallengeType } from "../entities/passkey-challenge.entity";

export class AuthChallengeDto {
    @IsEmail()
    email!: string;

    @IsEnum(EPasskeyChallengeType)
    @IsOptional()
    type?: EPasskeyChallengeType = EPasskeyChallengeType.Login
}