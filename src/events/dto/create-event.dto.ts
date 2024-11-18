import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsOptional, IsArray } from 'class-validator';

export class CreateEventDto {
    @ApiProperty({ example: 'Annual Sports Meet', description: 'The title of the event' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ example: 'A day full of sports activities', description: 'Description of the event', required: false })
    @IsOptional()
    @IsString()
    description?: string;

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
    @IsNotEmpty()
    eventLocation: string;

    @ApiProperty({ example: ['John Doe', 'Jane Smith'], description: 'List of members', required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    members?: string[];
}
