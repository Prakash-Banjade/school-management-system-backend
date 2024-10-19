import { ApiProperty, ApiPropertyOptional, OmitType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsDateString, IsDefined, IsEmail, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min, ValidateIf, ValidateNested } from "class-validator";
import { EBloodGroup, EReligion, Gender } from "src/common/types/global.type";
import { CreateGuardianDto } from "src/guardians/dto/create-guardian.dto";

export class GuardianOmitStudentId extends OmitType(CreateGuardianDto, ['studentId']) { }

export class CreateStudentDto {
    /**
    |--------------------------------------------------
    | ACADEMIC INFORMATION
    |--------------------------------------------------
    */

    @ApiProperty({ type: String, description: 'Class room ID of the student' })
    @IsUUID()
    @IsNotEmpty()
    classRoomId: string;

    @ApiPropertyOptional({ type: Number, description: 'Admission number of the student' })
    @IsNumber()
    @IsOptional()
    admissionNumber: number;

    @ApiProperty({ type: Number, description: 'Roll number of the student' })
    @IsNumber()
    @IsNotEmpty()
    rollNo: number;

    @ApiProperty({ type: Number, description: 'Admission date of the student' })
    @IsDateString()
    admissionDate: string;

    @ApiPropertyOptional({ type: Number, description: 'Fee discount percentage of the student' })
    @IsInt()
    @Max(100)
    @Min(0)
    @IsOptional()
    feeDiscountPercentage: number;

    @ApiPropertyOptional({ type: Number, description: 'Admission discount percentage of the student' })
    @IsInt()
    @Max(100)
    @Min(0)
    @IsOptional()
    admissionDiscountPercentage: number;

    @ApiPropertyOptional({ format: 'uuid' })
    @IsUUID()
    @IsOptional()
    dormitoryRoomId: string;

    /**
    |--------------------------------------------------
    | PERSONAL INFORMATION
    |--------------------------------------------------
    */

    @ApiProperty({ type: String, description: 'Student first name' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ type: String, description: 'Student last name' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiPropertyOptional({ type: 'enum', enum: Gender, description: 'Phone number of the student' })
    @IsEnum(Gender)
    gender: Gender

    @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Date of birth of the student' })
    @IsDateString()
    @IsNotEmpty()
    dob: string;

    @ApiPropertyOptional({ type: 'enum', enum: EReligion, description: 'Religioin of the student' })
    @IsEnum(EReligion)
    @IsOptional()
    religion?: EReligion;

    @ApiPropertyOptional({ type: String, description: 'Caste of the student' })
    @IsString()
    @IsOptional()
    caste?: string;

    @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Image ID', example: '5f3d1b0d-e5b8-4f8b-b5c2-f0c8d8c1c3c4' })
    @IsUUID()
    @IsOptional()
    profileImageId: string;

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

    @ApiProperty({ type: String, description: 'Email of the student' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ type: String, description: 'Phone number of the student' })
    @IsString()
    @IsNotEmpty()
    phone: string;

    /**
    |--------------------------------------------------
    | MEDICAL INFORMATION
    |--------------------------------------------------
    */

    @ApiPropertyOptional({ type: 'enum', enum: EBloodGroup, description: 'Blood group of the student' })
    @IsEnum(EBloodGroup)
    @IsOptional()
    bloodGroup?: EBloodGroup;

    @ApiPropertyOptional({ type: Number, description: 'Height of the student' })
    @IsNumber()
    @IsOptional()
    height: number;

    @ApiPropertyOptional({ type: Number, description: 'Weight of the student' })
    @IsNumber()
    @IsOptional()
    weight: number;

    /**
    |--------------------------------------------------
    | ADDRESS INFORMATION
    |--------------------------------------------------
    */

    @ApiPropertyOptional({ type: String, description: 'Current address of the student' })
    @IsString()
    @IsOptional()
    currentAddress: string;

    @ApiPropertyOptional({ type: String, description: 'Permanent address of the student' })
    @IsString()
    @IsOptional()
    permanentAddress: string;

    /**
    |--------------------------------------------------
    | DOCUMENT INFORMATION
    |--------------------------------------------------
    */

    @ApiPropertyOptional({ type: String, description: 'National ID card number of the student' })
    @IsString()
    @IsOptional()
    nationalIdCardNo: string;

    @ApiPropertyOptional({ type: String, description: 'Birth certificate number of the student' })
    @IsString()
    @IsOptional()
    birthCertificateNumber: string;

    @ApiPropertyOptional({ type: String, description: 'Additional notes of the student' })
    @IsString()
    @IsOptional()
    additionalNotes: string;

    @ApiPropertyOptional({ type: [String], format: 'uuid', description: 'Document attatchment gallery id' })
    @IsUUID("all", { each: true })
    @IsOptional()
    documentAttatchmentIds: string[];

    /**
    |--------------------------------------------------
    | BANK INFORMATION
    |--------------------------------------------------
    */

    @ApiPropertyOptional({ type: String, description: 'Bank name of the student' })
    @IsString()
    @IsNotEmpty()
    @ValidateIf(o => {
        return Boolean(o.bankAccountNumber) || Boolean(o.ifscCode)
    })
    bankName: string;

    @ApiPropertyOptional({ type: String, description: 'Bank account number of the student' })
    @IsString()
    @IsNotEmpty()
    @ValidateIf(o => {
        return Boolean(o.bankName) || Boolean(o.ifscCode)
    })
    bankAccountNumber: string;

    @ApiPropertyOptional({ type: String, description: 'IFSC code of the student' })
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

    @ApiPropertyOptional({ type: String, description: 'Details of the previous school' })
    @IsString()
    @IsOptional()
    previousSchoolDetails: string

}
