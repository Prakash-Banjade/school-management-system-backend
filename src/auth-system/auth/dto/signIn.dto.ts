import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsString } from "class-validator";
import { Role } from "src/common/types/global.type";

export class SignInDto {
    @ApiProperty({ type: 'string', description: 'Email', format: 'email' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ type: 'string', description: 'Password' })
    @IsString()
    @IsNotEmpty()
    password: string;
}

export class GuestSignInDto {
    @ApiProperty({ enum: Role, description: 'Role' })
    @IsEnum(Role)
    role: Role;
}