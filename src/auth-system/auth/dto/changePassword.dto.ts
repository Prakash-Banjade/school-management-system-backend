import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsStrongPassword } from "class-validator";

export class ChangePasswordDto {
    @ApiProperty({ type: String, description: 'Password' })
    @IsString()
    @IsNotEmpty()
    currentPassword!: string;

    @ApiProperty({ type: String, description: 'Password' })
    @IsString()
    @IsStrongPassword()
    newPassword!: string;

    @ApiProperty({ type: Boolean, description: 'Logout' })
    @IsBoolean()
    @IsOptional()
    logout?: boolean = false;
}