import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateGuardianDto {
    @ApiProperty({ type: String, description: 'Guardian first name' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ type: String, description: 'Guardian last name' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({ type: String, description: 'Guardian phone number' })
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiPropertyOptional({ type: String, description: 'Guardian email' })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional({ type: String, description: 'Guardian address' })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiProperty({ type: String, description: 'Guardian occupation' })
    @IsString()
    @IsNotEmpty()
    occupation: string;

    @ApiPropertyOptional({ type: String, format: 'uudi', description: 'Guardian image id' })
    @IsString()
    @IsOptional()
    imageId: string;

    @ApiProperty({ type: String, format: 'uuid', description: 'Student id' })
    @IsUUID()
    @IsNotEmpty()
    studentId: string;
}
