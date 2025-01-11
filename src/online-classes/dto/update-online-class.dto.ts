import { PartialType } from '@nestjs/swagger';
import { CreateOnlineClassDto } from './create-online-class.dto';

export class UpdateOnlineClassDto extends PartialType(CreateOnlineClassDto) {}
