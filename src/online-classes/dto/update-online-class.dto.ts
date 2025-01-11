import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateOnlineClassDto } from './create-online-class.dto';

export class UpdateOnlineClassDto extends PartialType(OmitType(CreateOnlineClassDto, ['classRoomId', 'subjectId'] as const)) { }
