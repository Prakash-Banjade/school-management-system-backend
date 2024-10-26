import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateGuardianDto } from './create-guardian.dto';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

// NO NEED TO UPDATE THE STUDENT
export class UpdateGuardianDto extends PartialType(OmitType(CreateGuardianDto, ['studentId'])) {
    @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Guardian id' })
    @IsNotEmpty()
    @IsUUID()
    @IsOptional()
    id: string; // if the guardian id is not provided, it will create a new guardian
}
