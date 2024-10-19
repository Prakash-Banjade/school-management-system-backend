import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateGuardianDto } from './create-guardian.dto';

// NO NEED TO UPDATE THE STUDENT
export class UpdateGuardianDto extends PartialType(OmitType(CreateGuardianDto, ['studentId'])) { }
