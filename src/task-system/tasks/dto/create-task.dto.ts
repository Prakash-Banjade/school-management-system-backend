import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { ArrayMaxSize, IsArray, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Length, ValidateIf } from "class-validator";
import { IsFutureDate } from "src/common/decorators/validators/isFutureDate.decorator";
import { IsUuidOrUrl } from "src/common/decorators/validators/isUrlOrUUid.decorator";
import { ETask } from "src/common/types/global.type";

export class CreateTaskDto {
    @ApiProperty({ type: "string", description: 'Task title' })
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value?.trim())
    @Length(1, 100, { message: 'Title must be less than 100 characters' })
    title: string;

    @ApiProperty({ type: "string", description: 'Task description' })
    @IsString()
    @IsNotEmpty()
    @Length(0, 500, { message: 'Description must be less than 500 characters' })
    @Transform(({ value }) => value?.trim())
    description: string;

    @ApiProperty({ type: "string", format: 'date-time', description: 'Submission task date' })
    @IsDateString()
    @IsFutureDate()
    @ValidateIf(o => o.taskType === ETask.ASSIGNMENT)
    deadline: string;

    @ApiProperty({ type: Number, description: 'Task type' })
    @IsInt()
    @IsOptional()
    marks?: number;

    @ApiProperty({ type: "string", description: 'Task type' })
    @IsEnum(ETask)
    taskType: ETask;

    @ApiPropertyOptional({ type: [String], format: 'uuid', isArray: true, description: 'Attachment ids or urls' })
    @IsUuidOrUrl({ each: true })
    @IsOptional()
    @ArrayMaxSize(5, { message: 'Maximum 5 attachments allowed' })
    attachmentIds?: string[];

    @ApiProperty({ type: "string", format: 'uuid', description: 'Subject id' })
    @IsUUID()
    @IsNotEmpty()
    subjectId: string;

    @ApiProperty({ type: "string", format: 'uuid', description: 'ClassRoom id' })
    @IsUUID()
    classRoomId: string;
}
