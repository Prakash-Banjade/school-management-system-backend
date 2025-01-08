import { BadRequestException } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsDateString, IsNotEmpty, IsOptional, IsString, Length, ValidateIf } from "class-validator";
import { differenceInDays, isBefore, startOfDay } from "date-fns";
import { IsFutureDate } from "src/common/decorators/isFutureDate.decorator";

export class CreateLeaveRequestDto {
    @ApiProperty({ type: String, format: 'date-time', example: '2022-10-18T00:00:00.000Z', description: 'Leave from date' })
    @IsDateString()
    @IsFutureDate({ message: 'Leave from date cannot be in the past' })
    @Transform(({ value }) => {
        if (isNaN(Date.parse(value))) throw new BadRequestException('Invalid leave from date');

        if (differenceInDays(startOfDay(new Date(value)), startOfDay(new Date())) > 7) throw new BadRequestException('Leave from date cannot be more than 7 days in the future');

        return value;
    })
    leaveFrom: string;

    @ApiProperty({ type: String, format: 'date-time', example: '2022-10-18T00:00:00.000Z', description: 'Leave to date' })
    @IsDateString()
    @IsNotEmpty()
    @ValidateIf(o => {
        if (isBefore(o.leaveTo, o.leaveFrom)) throw new BadRequestException('Leave to date cannot be before leave from date');
        return true;
    })
    leaveTo: string;

    @ApiProperty({ type: String, description: 'Leave title' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({ type: String, description: 'Leave description' })
    @IsString()
    @Length(0, 500, { message: 'Description must be less than 500 characters' })
    @IsNotEmpty()
    description: string;
}
