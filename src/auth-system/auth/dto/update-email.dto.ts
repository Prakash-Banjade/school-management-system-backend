import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class UpdateEmailDto {
    @IsEmail()
    @ApiProperty({ type: "string", description: 'New email' })
    newEmail: string;

    @ApiProperty({ type: "string", description: 'Password' })
    @IsString()
    @IsNotEmpty()
    password: string;
}