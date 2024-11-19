import { PartialType } from '@nestjs/swagger';
import { CreateChargeHeadDto } from './create-charge-head.dto';

export class UpdateChargeHeadDto extends PartialType(CreateChargeHeadDto) {}
