import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateLeaveRequestDto } from './create-leave-request.dto';
import { ELeaveRequestStatus } from 'src/common/types/global.type';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateLeaveRequestDto extends PartialType(OmitType(CreateLeaveRequestDto, ['accountId'])) { }

export class UpdateLeaveRequestStatusDto {
    @ApiProperty({ type: 'enum', enum: ELeaveRequestStatus, description: 'Leave request status' })
    @IsEnum(ELeaveRequestStatus)
    @IsNotEmpty()
    status: ELeaveRequestStatus;
}
