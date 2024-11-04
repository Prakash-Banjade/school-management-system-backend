import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateStudentDto } from './create-student.dto';
import { UpdateGuardianDto } from 'src/guardians/dto/update-guardian.dto';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';

export class UpdateStudentDto extends PartialType(OmitType(CreateStudentDto, ['classRoomId', 'guardians'])) {
    @ApiProperty({ type: [UpdateGuardianDto], description: 'Guardians of the student' })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => UpdateGuardianDto)
    @IsOptional()
    guardians?: UpdateGuardianDto[]
}

export class UpdateStudentClassDto {
    @ApiProperty()
    @IsUUID()
    classRoomId: string;

    @ApiProperty({ type: [String], format: 'uuid', isArray: true })
    @IsUUID('4', { each: true })
    @ArrayMinSize(1, { message: "At least one student is required" })
    studentIds: string;
}