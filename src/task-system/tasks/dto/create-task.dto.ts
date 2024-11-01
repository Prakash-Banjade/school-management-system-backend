import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { IsFutureDate } from "src/common/decorators/isFutureDate.decorator";
import { IsUuidOrUrl } from "src/common/decorators/isUrlOrUUid.decorator";
import { ETask } from "src/common/types/global.type";

export class CreateTaskDto {
    @ApiProperty({ type: String, description: 'Task title' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ type: String, description: 'Task description' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ type: String, format: 'date-time', description: 'Submission task date' })
    @IsDateString()
    @IsFutureDate()
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
