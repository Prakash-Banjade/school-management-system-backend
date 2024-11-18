import { BadRequestException } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateIf } from "class-validator";
import { IsFutureDate } from "src/common/decorators/isFutureDate.decorator";
import { IsUuidOrUrl } from "src/common/decorators/isUrlOrUUid.decorator";

export class CreateLessonPlanDto {
    @ApiProperty()
    @IsDateString()
    @IsFutureDate()
    startDate: string;

    @ApiProperty()
    @IsDateString()
    @IsFutureDate()
    @ValidateIf(o => {
        if (o.endDate && isNaN(Date.parse(o.endDate))) throw new BadRequestException('End date must be a valid date');
        if (new Date(o.startDate) > new Date(o.endDate)) throw new BadRequestException('End date must be greater than start date');
        return true;
    })
    endDate: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiPropertyOptional({ type: [String], format: 'uuid', isArray: true, description: 'Attachment ids or urls' })
    @IsUuidOrUrl({ each: true })
    @ArrayMaxSize(5, { message: 'Maximum 5 attachments allowed' })
    @IsOptional()
    attachmentIds?: string[];

    @ApiProperty({ type: String, format: 'uuid', description: 'Subject id' })
    @IsUUID()
    subjectId: string;

    @ApiProperty({ type: String, format: 'uuid', description: 'ClassRoom ids' })
    @IsUUID(4, { each: true })
    @IsArray()
    @ArrayMinSize(1)
    classRoomIds: string[];
}
