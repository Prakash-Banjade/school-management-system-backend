import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateLeaveRequestDto {
    @ApiProperty({ type: String, format: 'date-time', example: '2022-10-18T00:00:00.000Z', description: 'Leave from date' })
    @IsDateString()
    @IsNotEmpty()
    leaveFrom: string;

    @ApiProperty({ type: String, format: 'date-time', example: '2022-10-18T00:00:00.000Z', description: 'Leave to date' })
    @IsDateString()
    @IsNotEmpty()
    leaveTo: string;

    @ApiProperty({ type: String, description: 'Leave title' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ type: String, description: 'Leave description' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiPropertyOptional({ type: String, format: 'uuid', description: 'User id, the leave request is assigned to' })
    @IsUUID()
    @IsOptional()
    accountId?: string
}
