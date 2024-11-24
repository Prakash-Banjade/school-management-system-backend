import { BadRequestException } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, Length, ValidateIf } from "class-validator";
import { differenceInDays } from "date-fns";
import { IsFutureDate } from "src/common/decorators/isFutureDate.decorator";

export class CreateLeaveRequestDto {
    @ApiProperty({ type: String, format: 'date-time', example: '2022-10-18T00:00:00.000Z', description: 'Leave from date' })
    @IsDateString()
    @IsNotEmpty()
    @IsFutureDate({ message: 'Leave from date cannot be in the past' })
    leaveFrom: string;

    @ApiProperty({ type: String, format: 'date-time', example: '2022-10-18T00:00:00.000Z', description: 'Leave to date' })
    @IsDateString()
    @IsNotEmpty()
    @ValidateIf(o => {
        if (differenceInDays(new Date(o.leaveFrom), new Date(o.leaveTo)) > 0) throw new BadRequestException('Leave to date cannot be before leave from date');
        return true;
    })
    leaveTo: string;

    @ApiProperty({ type: String, description: 'Leave title' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({ type: String, description: 'Leave description' })
    @IsString()
    @IsOptional()
    @Length(0, 500, { message: 'Description must be less than 500 characters' })
    description?: string;
}
