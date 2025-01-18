import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsStrongPassword } from "class-validator";

export class ResetPasswordDto {
    @ApiProperty({ type: "string", description: 'Password' })
    @IsString()
    @IsNotEmpty()
    @IsStrongPassword({}, { message: 'Password is not strong enough' })
    password!: string;

    @ApiProperty({ type: "string", description: 'Token' })
    @IsString()
    @IsNotEmpty()
    token!: string;
}