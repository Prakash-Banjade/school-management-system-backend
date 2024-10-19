import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Length, Min } from "class-validator";
import { EBloodGroup, EMaritalStatus, Gender } from "src/common/types/global.type";

export class CreateTeacherDto {
    @ApiProperty({ type: Number, example: '5545', description: 'TeacherId of the teacher' })
    @IsNumber()
    @IsOptional()
    teacherId?: number;

    @ApiProperty({ type: String, example: 'John', description: 'First name of the teacher' })
    @IsString()
    @IsNotEmpty()
    firstName!: string;

    @ApiPropertyOptional({ type: String, example: 'Doe', description: 'Last name of the teacher' })
    @IsString()
    @IsNotEmpty()
    lastName?: string;

    @ApiProperty({ type: 'enum', enum: Gender, example: Gender.MALE, description: 'Gender of the teacher' })
    @IsEnum(Gender)
    @IsNotEmpty()
    gender!: Gender;

    @ApiProperty({ type: String, example: 'johnDoe@example.com', description: 'Email of the teacher' })
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @ApiProperty({ type: String, example: '1234567890', description: 'Phone number of the teacher' })
    @IsString()
    @IsNotEmpty()
    @Length(10, 12)
    phone!: string;

    @ApiProperty({ type: Date, format: 'date-time', example: '2024-07-19T11:02:05.462Z', description: 'Date of birth of the teacher' })
    @IsDateString()
    @IsNotEmpty()
    dob!: string;

    @ApiProperty({ type: Number, example: 10000, description: 'Wage of the teacher' })
    @IsNotEmpty()
    @Min(0)
    @IsNumber()
    wage!: number;

    @ApiPropertyOptional({ type: String, format: 'uuid', example: 'd6a5f7c0-0f0f-4f7c-0f7c-0f7c0f7c0f7c', description: 'Profile image id of the teacher' })
    @IsUUID()
    @IsOptional()
    profileImageId!: string;

    @ApiProperty({ type: String, example: 'BCA', description: 'Qualification of the teacher' })
    @IsString()
    @IsNotEmpty()
    qualification: string;

    @ApiPropertyOptional({ type: String, example: 'Short description of the teacher', description: 'Short description of the teacher' })
    @IsString()
    @IsOptional()
    shortDescription?: string;

    @ApiProperty({ type: 'enum', enum: EMaritalStatus, example: EMaritalStatus.MARRIED, description: 'Marital status of the teacher' })
    @IsEnum(EMaritalStatus)
    @IsNotEmpty()
    maritalStatus!: EMaritalStatus;

    @ApiProperty({ type: 'enum', enum: EBloodGroup, example: EBloodGroup.B_POSITIVE, description: 'Blood group of the teacher' })
    @IsEnum(EBloodGroup)
    @IsNotEmpty()
    bloodGroup!: EBloodGroup;

    @ApiProperty({ type: Date, format: 'date-time', example: '2024-07-19T11:02:05.462Z', description: 'Date of birth of the teacher' })
    @IsDateString()
    @IsNotEmpty()
    joinedDate!: string;

    @ApiProperty({ type: String, example: 'Swish Bank', description: 'Bank name of the teacher' })
    @IsString()
    @IsNotEmpty()
    bankName!: string;

    @ApiProperty({ type: String, example: 'John Doe', description: 'Bank account name of the teacher' })
    @IsString()
    @IsNotEmpty()
    accountName!: string;

    @ApiProperty({ type: String, example: '1234567890', description: 'Bank account number of the teacher' })
    @IsString()
    @IsNotEmpty()
    accountNumber!: string;
}
