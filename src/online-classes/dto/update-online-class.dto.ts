import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateOnlineClassDto } from './create-online-class.dto';
import { IsEnum } from 'class-validator';
import { EOnlineClassStatus } from '../entities/online-class.entity';

export class UpdateOnlineClassDto extends PartialType(OmitType(CreateOnlineClassDto, ['classRoomId', 'subjectId', 'scheduleDate'] as const)) { }

export class UpdateOnlineClassStatusDto {
    @ApiProperty()
    @IsEnum(EOnlineClassStatus)
    status: EOnlineClassStatus;
}
