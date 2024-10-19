import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Length, Min } from "class-validator";
import { BloodGroup, EStaff, Gender, MaritalStatus } from "src/core/types/global.types";

export class CreateStaffDto {
    @ApiProperty({ type: Number, example: '5545', description: 'StaffId of the staff' })
    @IsNumber()
    @IsOptional()
    staffId?: number;

    @ApiProperty({ type: 'enum', enum: EStaff, example: EStaff.DRIVER, description: 'Type of the staff' })
    @IsEnum(EStaff)
    @IsNotEmpty()
    type: EStaff

    @ApiProperty({ type: String, example: 'John', description: 'First name of the staff' })
    @IsString()
    @IsNotEmpty()
    firstName!: string;

    @ApiPropertyOptional({ type: String, example: 'Doe', description: 'Last name of the staff' })
    @IsString()
    @IsNotEmpty()
    lastName?: string;

    @ApiProperty({ type: 'enum', enum: Gender, example: Gender.MALE, description: 'Gender of the staff' })
    @IsEnum(Gender)
    @IsNotEmpty()
    gender!: Gender;

    @ApiProperty({ type: String, example: 'johnDoe@example.com', description: 'Email of the staff' })
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @ApiProperty({ type: String, example: '1234567890', description: 'Phone number of the staff' })
    @IsString()
    @IsNotEmpty()
    @Length(10, 12)
    phone!: string;

    @ApiProperty({ type: Date, format: 'date-time', example: '2024-07-19T11:02:05.462Z', description: 'Date of birth of the staff' })
    @IsDateString()
    @IsNotEmpty()
    dob!: string;

    @ApiProperty({ type: Number, example: 10000, description: 'Wage of the staff' })
    @IsNotEmpty()
    @Min(0)
    @IsNumber()
    wage!: number;

    @ApiPropertyOptional({ type: String, format: 'uuid', example: 'd6a5f7c0-0f0f-4f7c-0f7c-0f7c0f7c0f7c', description: 'Profile image id of the staff' })
    @IsUUID()
    @IsOptional()
    profileImageId!: string;

    @ApiProperty({ type: String, example: 'BCA', description: 'Qualification of the staff' })
    @IsString()
    @IsNotEmpty()
    qualification: string;

    @ApiPropertyOptional({ type: String, example: 'Short description of the staff', description: 'Short description of the staff' })
    @IsString()
    @IsOptional()
    shortDescription?: string;

    @ApiProperty({ type: 'enum', enum: MaritalStatus, example: MaritalStatus.MARRIED, description: 'Marital status of the staff' })
    @IsEnum(MaritalStatus)
    @IsNotEmpty()
    maritalStatus!: MaritalStatus;

    @ApiProperty({ type: 'enum', enum: BloodGroup, example: BloodGroup.B_POSITIVE, description: 'Blood group of the staff' })
    @IsEnum(BloodGroup)
    @IsNotEmpty()
    bloodGroup!: BloodGroup;

    @ApiProperty({ type: Date, format: 'date-time', example: '2024-07-19T11:02:05.462Z', description: 'Date of birth of the staff' })
    @IsDateString()
    @IsNotEmpty()
    joinedDate!: string;

    @ApiProperty({ type: String, example: 'Swish Bank', description: 'Bank name of the staff' })
    @IsString()
    @IsOptional()
    bankName?: string;

    @ApiProperty({ type: String, example: 'John Doe', description: 'Bank account name of the staff' })
    @IsString()
    @IsOptional()
    accountName?: string;

    @ApiProperty({ type: String, example: '1234567890', description: 'Bank account number of the staff' })
    @IsString()
    @IsOptional()
    accountNumber?: string;
}
