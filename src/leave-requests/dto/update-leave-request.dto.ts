import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateLeaveRequestDto } from './create-leave-request.dto';
import { ELeaveRequestStatus } from 'src/common/types/global.type';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateLeaveRequestDto extends PartialType(CreateLeaveRequestDto) { }

export class UpdateLeaveRequestStatusDto {
    @ApiProperty({ type: 'string', enum: ELeaveRequestStatus, description: 'Leave request status' })
    @IsEnum(ELeaveRequestStatus)
    @IsNotEmpty()
    status: ELeaveRequestStatus;
}
