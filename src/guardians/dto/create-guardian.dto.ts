import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from "class-validator";
import { PHONE_NUMBER_REGEX } from "src/common/CONSTANTS";
import { IsOptionalEmail } from "src/common/decorators/validators/isOptionalEmail.decorator";
import { IsUuidOrUrl } from "src/common/decorators/validators/isUrlOrUUid.decorator";
import { EGuardianRelation } from "src/common/types/global.type";

export class CreateGuardianDto {
    @ApiProperty({ type: "string", description: 'Guardian first name' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ type: "string", description: 'Guardian last name' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({ type: 'string', enum: EGuardianRelation, description: 'Guardian relation' })
    @IsEnum(EGuardianRelation)
    @IsNotEmpty()
    relation: EGuardianRelation;

    @ApiProperty({ type: "string", description: 'Guardian phone number' })
    @IsString()
    @IsNotEmpty()
    @Matches(PHONE_NUMBER_REGEX)
    phone: string;

    @ApiPropertyOptional({ type: "string", description: 'Guardian email' })
    @IsOptionalEmail()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional({ type: "string", description: 'Guardian address' })
    @IsString()
    @IsNotEmpty()
    address: string;

    @ApiProperty({ type: "string", description: 'Guardian occupation' })
    @IsString()
    @IsNotEmpty()
    occupation: string;

    @ApiPropertyOptional({ type: "string", description: 'Guardian image id/url' })
    @IsUuidOrUrl()
    @IsOptional()
    profileImageId: string;

    @ApiProperty({ type: "string", format: 'uuid', description: 'Student id' })
    @IsUUID()
    @IsNotEmpty()
    studentId: string;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    receiveNotification?: boolean;
}

