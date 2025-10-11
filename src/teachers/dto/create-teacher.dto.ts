import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches, Min, ValidateNested } from "class-validator";
import { NAME_REGEX, NAME_WITH_SPACE_REGEX, PHONE_NUMBER_REGEX } from "src/common/CONSTANTS";
import { IsDateOfBirth } from "src/common/decorators/validators/isDateOfBrith.decorator";
import { IsNotFutureDate } from "src/common/decorators/validators/isNotFutureDate.decorator";
import { IsUuidOrUrl } from "src/common/decorators/validators/isUrlOrUUid.decorator";
import { EBloodGroup, EMaritalStatus, Gender } from "src/common/types/global.type";
import { AllowanceDto } from "src/finance-system/salary-management/salary-structures/dto/create-salary-structure.dto";

export class CreateEmployeeDto {
    @ApiProperty({ type: "string", example: 'John', description: 'First name of the teacher' })
    @IsString()
    @IsNotEmpty()
    @Matches(NAME_REGEX, {
        message: 'Name can have only alphabets'
    })
    firstName!: string;

    @ApiPropertyOptional({ type: "string", example: 'Doe', description: 'Last name of the teacher' })
    @IsString()
    @IsNotEmpty()
    @Matches(NAME_WITH_SPACE_REGEX, {
        message: 'Seems like invalid last name'
    })
    lastName?: string;

    @ApiProperty({ type: 'string', enum: Gender, example: Gender.MALE, description: 'Gender of the teacher' })
    @IsEnum(Gender)
    @IsNotEmpty()
    gender!: Gender;

    @ApiProperty({ type: "string", example: 'johnDoe@example.com', description: 'Email of the teacher' })
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @ApiProperty({ type: "string", example: '1234567890', description: 'Phone number of the teacher' })
    @IsString()
    @IsNotEmpty()
    @Matches(PHONE_NUMBER_REGEX)
    phone!: string;

    @ApiProperty({ type: Date, format: 'date-time', example: '2024-07-19T11:02:05.462Z', description: 'Date of birth of the teacher' })
    @IsDateString()
    @IsNotEmpty()
    @IsDateOfBirth(18, 80, { message: 'Date of birth must result in an age between 18 and 80 years.' })
    dob!: string;

    @ApiProperty({ type: Number, example: 10000, description: 'Baisc salary of the teacher' })
    @IsNotEmpty()
    @Min(0)
    @IsNumber()
    basicSalary!: number;

    @ApiPropertyOptional({ type: [AllowanceDto], description: 'Allowances of the teacher' })
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => AllowanceDto)
    allowances?: AllowanceDto[];

    @ApiProperty({ type: [String], description: 'Departments of the teacher' })
    @IsUUID('all', { each: true })
    @ArrayMinSize(1, { message: 'Please choose at least one department.' })
    facultyIds: string[];

    @ApiPropertyOptional({ type: "string", description: 'Profile image id/url of the teacher' })
    @IsUuidOrUrl()
    @IsOptional()
    profileImageId!: string;

    @ApiProperty({ type: "string", example: 'BCA', description: 'Qualification of the teacher' })
    @IsString()
    @IsNotEmpty()
    qualification: string;

    @ApiPropertyOptional({ type: "string", example: 'Short description of the teacher', description: 'Short description of the teacher' })
    @IsString()
    @IsOptional()
    shortDescription?: string;

    @ApiProperty({ type: 'string', enum: EMaritalStatus, example: EMaritalStatus.MARRIED, description: 'Marital status of the teacher' })
    @IsEnum(EMaritalStatus)
    @IsNotEmpty()
    maritalStatus!: EMaritalStatus;

    @ApiProperty({ type: 'string', enum: EBloodGroup, example: EBloodGroup.B_POSITIVE, description: 'Blood group of the teacher' })
    @IsEnum(EBloodGroup)
    @IsNotEmpty()
    bloodGroup!: EBloodGroup;

    @ApiProperty({ type: Date, format: 'date-time', example: '2024-07-19T11:02:05.462Z', description: 'Date of birth of the teacher' })
    @IsDateString()
    @IsNotFutureDate({ message: 'Joining date cannot be in the future' })
    @IsNotEmpty()
    joinedDate!: string;

    @ApiPropertyOptional({ type: [String], description: 'Document attachment gallery id/url' })
    @IsString({ each: true })
    @IsOptional()
    @ArrayMaxSize(5, { message: 'Maximum 5 attachments allowed' })
    documentAttachmentIds: string[];

    @ApiProperty({ type: "string", example: 'Swish Bank', description: 'Bank name of the teacher' })
    @IsString()
    @IsNotEmpty()
    bankName!: string;

    @ApiProperty({ type: "string", example: 'John Doe', description: 'Bank account name of the teacher' })
    @IsString()
    @IsNotEmpty()
    accountName!: string;

    @ApiProperty({ type: "string", example: '1234567890', description: 'Bank account number of the teacher' })
    @IsString()
    @IsNotEmpty()
    accountNumber!: string;
}

export class CreateTeacherDto extends CreateEmployeeDto { }
