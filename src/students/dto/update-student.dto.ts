import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateStudentDto } from './create-student.dto';
import { UpdateGuardianDto } from 'src/guardians/dto/update-guardian.dto';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, ValidateNested } from 'class-validator';

export class UpdateStudentDto extends PartialType(OmitType(CreateStudentDto, ['classRoomId', 'guardians'])) {
    @ApiProperty({ type: [UpdateGuardianDto], description: 'Guardians of the student' })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => UpdateGuardianDto)
    @IsOptional()
    guardians?: UpdateGuardianDto[]
}
