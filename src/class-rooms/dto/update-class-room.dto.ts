import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateClassRoomDto } from './create-class-room.dto';

export class UpdateClassRoomDto extends PartialType(OmitType(CreateClassRoomDto, ['parentClassId', 'monthlyFee', 'admissionFee', 'facultyId', 'degreeLevel'])) { }
