import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateLessonPlanDto } from './create-lesson-plan.dto';
import { ELessonPlanStatus } from 'src/common/types/global.type';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateLessonPlanDto extends PartialType(OmitType(CreateLessonPlanDto, ['classRoomId', 'subjectId'])) { }

export class UpdateLessonPlanStatusDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsEnum(ELessonPlanStatus)
    status?: ELessonPlanStatus;
}

