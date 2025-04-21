import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { ClassRoomSearchQueryDto } from "src/common/dto/classRoomSearchQueryDto";
import { ETask } from "src/common/types/global.type";

export enum ETaskCategory {
    PENDING = 'pending',
    SUBMITTED = 'submitted',
    EVALUATED = 'evaluated',
}

export class TaskQueryDto extends ClassRoomSearchQueryDto {

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    subjectId?: string;

    @ApiPropertyOptional()
    @IsEnum(ETask)
    @IsOptional()
    taskType?: ETask;

    @ApiPropertyOptional({ enum: ETaskCategory, default: ETaskCategory.PENDING })
    @IsOptional()
    @IsString()
    category: ETaskCategory = ETaskCategory.PENDING;
}