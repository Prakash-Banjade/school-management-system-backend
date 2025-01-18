import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsStrongPassword } from "class-validator";

export class ChangePasswordDto {
    @ApiProperty({ type: "string", description: 'Current password' })
    @IsString()
    @IsNotEmpty()
    currentPassword!: string;

    @ApiProperty({ type: "string", description: 'New password' })
    @IsString()
    @IsStrongPassword()
    newPassword!: string;

    @ApiProperty({ type: Boolean, description: 'Logout out of all devices flag. If true, user will be logged out of all devices' })
    @IsBoolean()
    @IsOptional()
    logout?: boolean = false;
}