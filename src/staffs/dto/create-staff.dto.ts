import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Min } from "class-validator";
import { NAME_REGEX, NAME_WITH_SPACE_REGEX, PHONE_NUMBER_REGEX } from "src/common/CONSTANTS";
import { IsUuidOrUrl } from "src/common/decorators/isUrlOrUUid.decorator";
import { EBloodGroup, EMaritalStatus, EStaff, Gender } from "src/common/types/global.type";

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
    @Matches(NAME_REGEX, {
        message: 'Name can have only alphabets'
    })
    firstName!: string;

    @ApiPropertyOptional({ type: String, example: 'Doe', description: 'Last name of the staff' })
    @IsString()
    @IsNotEmpty()
    @Matches(NAME_WITH_SPACE_REGEX, {
        message: 'Seems like invalid last name'
    })
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
    @Matches(PHONE_NUMBER_REGEX)
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

    @ApiPropertyOptional({ type: String, description: 'Profile image id/url of the staff' })
    @IsUuidOrUrl()
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

    @ApiProperty({ type: 'enum', enum: EMaritalStatus, example: EMaritalStatus.MARRIED, description: 'Marital status of the staff' })
    @IsEnum(EMaritalStatus)
    @IsNotEmpty()
    maritalStatus!: EMaritalStatus;

    @ApiProperty({ type: 'enum', enum: EBloodGroup, example: EBloodGroup.B_POSITIVE, description: 'Blood group of the staff' })
    @IsEnum(EBloodGroup)
    @IsNotEmpty()
    bloodGroup!: EBloodGroup;

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
