import { PartialType } from '@nestjs/swagger';
import { CreateFeesGroupDto } from './create-fees-group.dto';

export class UpdateFeesGroupDto extends PartialType(CreateFeesGroupDto) {}
