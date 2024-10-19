import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateFeesTypeDto } from './create-fees-type.dto';

export class UpdateFeesTypeDto extends PartialType(OmitType(CreateFeesTypeDto, ['feeGroupId'])) {}
