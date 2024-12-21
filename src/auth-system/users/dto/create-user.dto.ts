import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from "class-validator";
import { NAME_REGEX, NAME_WITH_SPACE_REGEX } from "src/common/CONSTANTS";
import { IsUuidOrUrl } from "src/common/decorators/isUrlOrUUid.decorator";

export class CreateUserDto {
    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ type: String, description: 'Student first name' })
    @IsString()
    @IsNotEmpty()
    @Matches(NAME_REGEX, {
        message: 'Name can have only alphabets'
    })
    firstName: string;

    @ApiProperty({ type: String, description: 'Student last name' })
    @IsString()
    @IsNotEmpty()
    @Matches(NAME_WITH_SPACE_REGEX, {
        message: 'Seems like invalid last name'
    })
    lastName: string;

    @ApiPropertyOptional({ format: 'uuid' })
    @IsUUID()
    @IsOptional()
    branchId?: string; // there may not be any branch

    @ApiPropertyOptional({ type: String, description: 'Image ID/URL' })
    @IsUuidOrUrl()
    @IsOptional()
    profileImageId?: string;
}
