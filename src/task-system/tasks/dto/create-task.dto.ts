import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Length, Max, ValidateIf } from "class-validator";
import { IsFutureDate } from "src/common/decorators/isFutureDate.decorator";
import { IsUuidOrUrl } from "src/common/decorators/isUrlOrUUid.decorator";
import { ETask } from "src/common/types/global.type";

export class CreateTaskDto {
    @ApiProperty({ type: String, description: 'Task title' })
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value?.trim())
    @Length(1, 100, { message: 'Title must be less than 100 characters' })
    title: string;

    @ApiProperty({ type: String, description: 'Task description' })
    @IsString()
    @IsNotEmpty()
    @Length(0, 500, { message: 'Description must be less than 500 characters' })
    @Transform(({ value }) => value?.trim())
    description: string;

    @ApiProperty({ type: String, format: 'date-time', description: 'Submission task date' })
    @IsDateString()
    @IsFutureDate()
    @ValidateIf(o => o.taskType === ETask.ASSIGNMENT)
    deadline: string;

    @ApiProperty({ type: Number, description: 'Task type' })
    @IsInt()
    @IsOptional()
    marks?: number;

    @ApiProperty({ type: String, description: 'Task type' })
    @IsEnum(ETask)
    taskType: ETask;

    @ApiPropertyOptional({ type: [String], format: 'uuid', isArray: true, description: 'Attachment ids or urls' })
    @IsUuidOrUrl({ each: true })
    @IsOptional()
    @ArrayMaxSize(5, { message: 'Maximum 5 attachments allowed' })
    attachmentIds?: string[];

    @ApiProperty({ type: String, format: 'uuid', description: 'Subject id' })
    @IsUUID()
    @IsNotEmpty()
    subjectId: string;

    @ApiProperty({ type: String, format: 'uuid', description: 'ClassRoom ids' })
    @IsUUID(4, { each: true })
    @IsArray()
    @ArrayMinSize(1)
    classRoomIds: string[];
}
