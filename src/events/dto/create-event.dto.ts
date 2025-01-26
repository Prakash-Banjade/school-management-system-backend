import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsOptional, IsArray, ValidateIf, IsMilitaryTime } from 'class-validator';
import { differenceInMinutes, isAfter, parse } from 'date-fns';

export class CreateEventDto {
    @ApiProperty({ example: 'Annual Sports Meet', description: 'The title of the event' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ example: 'A day full of sports activities', description: 'Description of the event', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsMilitaryTime({ message: "Invalid start time. Required format: HH:MM" })
    beginTime: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsMilitaryTime({ message: "Invalid end time. Required format: HH:MM" })
    @ValidateIf((o: CreateEventDto) => {
        if (o.beginTime && o.endingTime) {
            const startTime = parse(o.beginTime, 'HH:mm', new Date());
            const endTime = parse(o.endingTime, 'HH:mm', new Date());
            if (isAfter(startTime, endTime)) throw new BadRequestException('End time must be greater than start time');
            if (differenceInMinutes(endTime, startTime) < 10) throw new BadRequestException('At least 10 minutes difference is required');
        }

        return true;
    })
    endingTime: string;

    @ApiProperty({ example: '2024-12-01T10:00:00Z', description: 'Start date and time of the event' })
    @IsDateString()
    @IsNotEmpty()
    dateFrom: string;

    @ApiProperty({ example: '2024-12-01T18:00:00Z', description: 'End date and time of the event' })
    @IsDateString()
    @IsNotEmpty()
    dateTo: string;

    @ApiProperty({ example: 'City Park', description: 'Location of the event' })
    @IsString()
    @IsOptional()
    eventLocation?: string;

    @ApiProperty({ example: ['John Doe', 'Jane Smith'], description: 'List of members', required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    members?: string[];
}
