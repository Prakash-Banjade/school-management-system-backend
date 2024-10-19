import { PartialType } from '@nestjs/swagger';
import { CreateDormitoryRoomDto } from './create-dormitory-room.dto';

export class UpdateDormitoryRoomDto extends PartialType(CreateDormitoryRoomDto) {}
