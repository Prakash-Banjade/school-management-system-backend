import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
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
    @IsNotEmpty()
    submissionDate: string;

    @ApiProperty({ type: Number, description: 'Task type' })
    @IsInt()
    @IsOptional()
    marks?: number;

    @ApiProperty({ type: String, description: 'Task type' })
    @IsEnum(ETask)
    taskType: ETask;

    @ApiPropertyOptional({ type: [String], format: 'uuid', description: 'Gallery id that contains the attatchments' })
    @IsUUID("all", { each: true })
    @IsOptional()
    attatchmentIds: string[];

    @ApiProperty({ type: String, format: 'uuid', description: 'Subject id' })
    @IsUUID()
    @IsNotEmpty()
    subjectId: string;
}
