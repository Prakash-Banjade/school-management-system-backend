import { BadRequestException } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, IsUUID, Length } from "class-validator";
import { addDays, isBefore, isFuture, startOfDay } from "date-fns";

export class CreateOnlineClassDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value?.trim())
    @Length(1, 100, { message: 'Title must be less than 100 characters' })
    title: string;

    @ApiPropertyOptional()
    @IsString()
    @Length(1, 500, { message: 'Description must be less than 500 characters' })
    @IsOptional()
    @Transform(({ value }) => value?.trim())
    description?: string;

    @ApiProperty()
    @IsUUID()
    classRoomId: string;

    @ApiProperty()
    @IsUUID()
    subjectId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => {
        if (value && (!isFuture(value) || !isBefore(value, startOfDay(addDays(new Date(), 3))))) {
            throw new BadRequestException('Schedule date must be a future date less than 3 days from now');
        }

        return value;
    })
    scheduleDate?: string;
}
