import { BadRequestException } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, isDateString, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, Length, ValidateIf } from "class-validator";
import { isFuture, isToday } from "date-fns";
import { IsFutureDate } from "src/common/decorators/validators/isFutureDate.decorator";
import { IsUuidOrUrl } from "src/common/decorators/validators/isUrlOrUUid.decorator";

export class CreateLessonPlanDto {
    @ApiProperty()
    @Transform(({ value }) => {
        if (!isDateString(value)) throw new BadRequestException('Start date must be a valid date');
        if (!isToday(value) && !isFuture(value)) throw new BadRequestException('Start date must be in the future');

        return value;
    })
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
    @Transform(({ value }) => value?.trim())
    @Length(1, 100, { message: 'Title must be less than 100 characters' })
    title: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @Length(0, 500, { message: 'Description must be less than 500 characters' })
    @Transform(({ value }) => value?.trim())
    description: string;

    @ApiPropertyOptional({ type: [String], format: 'uuid', isArray: true, description: 'Attachment ids or urls' })
    @IsUuidOrUrl({ each: true })
    @ArrayMaxSize(5, { message: 'Maximum 5 attachments allowed' })
    @IsOptional()
    attachmentIds?: string[];

    @ApiProperty({ type: "string", format: 'uuid', description: 'Subject id' })
    @IsUUID()
    subjectId: string;

    @ApiProperty({ type: "string", format: 'uuid', description: 'ClassRoom ids' })
    @IsUUID(4, { each: true })
    @IsArray()
    @ArrayMinSize(1)
    classRoomIds: string[];
}
