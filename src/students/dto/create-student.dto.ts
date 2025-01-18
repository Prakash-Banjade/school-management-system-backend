import { BadRequestException } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional, OmitType } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsDateString, IsDefined, IsEmail, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Length, Matches, Max, MaxLength, Min, ValidateIf, ValidateNested } from "class-validator";
import { subYears } from "date-fns";
import { NAME_REGEX, NAME_WITH_SPACE_REGEX, PHONE_NUMBER_REGEX } from "src/common/CONSTANTS";
import { IsDateOfBirth } from "src/common/decorators/validators/isDateOfBrith.decorator";
import { IsNotFutureDate } from "src/common/decorators/validators/isNotFutureDate.decorator";
import { IsUuidOrUrl } from "src/common/decorators/validators/isUrlOrUUid.decorator";
import { EBloodGroup, EReligion, Gender } from "src/common/types/global.type";
import { CreateGuardianDto } from "src/guardians/dto/create-guardian.dto";

export class GuardianOmitStudentId extends OmitType(CreateGuardianDto, ['studentId']) { }

export class CreateStudentDto {
    /**
    |--------------------------------------------------
    | ACADEMIC INFORMATION
    |--------------------------------------------------
    */

    @ApiProperty({ type: "string", description: 'Class room ID of the student' })
    @IsUUID()
    @IsNotEmpty()
    classRoomId: string;

    @ApiProperty({ type: Number, description: 'Roll number of the student' })
    @IsNumber()
    @IsNotEmpty()
    @Min(1, { message: 'Roll number must be greater than 0' })
    rollNo: number;

    @ApiProperty({ type: Number, description: 'Admission date of the student' })
    @IsDateString()
    @IsNotFutureDate()
    @IsOptional()
    admissionDate?: string;

    @ApiPropertyOptional({ format: 'uuid' })
    @IsUUID()
    @IsOptional()
    dormitoryRoomId?: string;

    @ApiPropertyOptional({ format: 'uuid' })
    @IsUUID()
    @IsOptional()
    routeStopId?: string;

    /**
    |--------------------------------------------------
    | PERSONAL INFORMATION
    |--------------------------------------------------
    */

    @ApiProperty({ type: "string", description: 'Student first name' })
    @IsString()
    @IsNotEmpty()
    @Matches(NAME_REGEX, {
        message: 'Name can have only alphabets'
    })
    firstName: string;

    @ApiProperty({ type: "string", description: 'Student last name' })
    @IsString()
    @IsNotEmpty()
    @Matches(NAME_WITH_SPACE_REGEX, {
        message: 'Seems like invalid last name'
    })
    lastName: string;

    @ApiPropertyOptional({ type: 'string', enum: Gender, description: 'Gender number of the student' })
    @IsEnum(Gender)
    gender: Gender

    @ApiPropertyOptional({ type: 'string', format: 'date-time', description: 'Date of birth of the student' })
    @IsDateString()
    @IsDateOfBirth(2, 80, { message: 'Date of birth must result in an age between 2 and 80 years.' })
    dob: string;

    @ApiProperty({ type: 'string', enum: EReligion, description: 'Religioin of the student' })
    @IsEnum(EReligion)
    religion?: EReligion;

    @ApiPropertyOptional({ type: "string", description: 'Caste of the student' })
    @IsString()
    @IsOptional()
    caste?: string;

    @ApiPropertyOptional({ type: "string", description: 'Image ID/URL' })
    @IsUuidOrUrl()
    @IsOptional()
    profileImageId?: string;

    @ApiPropertyOptional({ type: Boolean, description: 'Is the student physically challenged?' })
    @IsBoolean()
    @IsOptional()
    isPhysicallyChallenged?: boolean;

    @ApiProperty({ type: [GuardianOmitStudentId], description: 'Guardians of the student' })
    @IsDefined()
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => GuardianOmitStudentId)
    guardians: GuardianOmitStudentId[]

    /**
    |--------------------------------------------------
    | CONTACT INFORMATION
    |--------------------------------------------------
    */

    @ApiProperty({ type: "string", description: 'Email of the student' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ type: "string", description: 'Phone number of the student' })
    @IsString()
    @IsNotEmpty()
    @Matches(PHONE_NUMBER_REGEX)
    phone: string;

    /**
    |--------------------------------------------------
    | MEDICAL INFORMATION
    |--------------------------------------------------
    */

    @ApiPropertyOptional({ type: 'string', enum: EBloodGroup, description: 'Blood group of the student' })
    @IsEnum(EBloodGroup)
    @IsOptional()
    bloodGroup?: EBloodGroup;

    /**
    |--------------------------------------------------
    | ADDRESS INFORMATION
    |--------------------------------------------------
    */

    @ApiProperty({ type: "string", description: 'Current address of the student' })
    @IsString()
    @IsNotEmpty()
    @Length(1, 80)
    currentAddress: string;

    @ApiProperty({ type: "string", description: 'Permanent address of the student' })
    @IsString()
    @IsNotEmpty()
    @Length(1, 80)
    permanentAddress: string;

    /**
    |--------------------------------------------------
    | DOCUMENT INFORMATION
    |--------------------------------------------------
    */

    @ApiPropertyOptional({ type: "string", description: 'National ID card number of the student' })
    @IsString()
    @IsOptional()
    nationalIdCardNo: string;

    @ApiPropertyOptional({ type: "string", description: 'Birth certificate number of the student' })
    @IsString()
    @IsOptional()
    birthCertificateNumber: string;

    @ApiPropertyOptional({ type: "string", description: 'Additional notes of the student' })
    @IsString()
    @IsOptional()
    @MaxLength(1000)
    additionalNotes: string;

    @ApiPropertyOptional({ type: [String], description: 'Document attachment gallery id/url' })
    @IsString({ each: true })
    @IsOptional()
    @ArrayMaxSize(5, { message: 'Maximum 5 attachments allowed' })
    documentAttachmentIds: string[];

    /**
    |--------------------------------------------------
    | BANK INFORMATION
    |--------------------------------------------------
    */

    @ApiPropertyOptional({ type: "string", description: 'Bank name of the student' })
    @IsString()
    @IsNotEmpty()
    @ValidateIf(o => {
        return Boolean(o.bankAccountNumber) || Boolean(o.ifscCode)
    })
    bankName: string;

    @ApiPropertyOptional({ type: "string", description: 'Bank account number of the student' })
    @IsString()
    @IsNotEmpty()
    @ValidateIf(o => {
        return Boolean(o.bankName) || Boolean(o.ifscCode)
    })
    bankAccountNumber: string;

    @ApiPropertyOptional({ type: "string", description: 'IFSC code of the student' })
    @IsString()
    @IsNotEmpty()
    @ValidateIf(o => {
        return Boolean(o.bankAccountNumber) || Boolean(o.bankName)
    })
    ifscCode: string;

    /**
    |--------------------------------------------------
    | PREVIOUS SCHOOL INFORMATION
    |--------------------------------------------------
    */

    @ApiPropertyOptional({ type: "string", description: 'Name of the previous school' })
    @IsString()
    @IsOptional()
    @Length(1, 80)
    previousSchoolName?: string

    @ApiPropertyOptional({ type: "string", description: 'Details of the previous school' })
    @IsString()
    @IsOptional()
    @MaxLength(1000)
    previousSchoolDetails: string
}
