import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsString } from "class-validator";

export class CreateNoticeDto {
    @ApiProperty({ type: String, format: 'date-time', example: '2022-10-18T00:00:00.000Z', description: 'Notice Published Date' })
    @IsDateString()
    @IsNotEmpty()
    date: string = new Date().toISOString();

    @ApiProperty({ type: String, description: 'Title' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ type: String, description: 'Description' })
    @IsString()
    @IsNotEmpty()
    description: string;
}
