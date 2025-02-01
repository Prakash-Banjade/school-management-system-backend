import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateExamTypeDto {
    @ApiProperty({ type: String, description: 'Name of the exam type' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ type: String, description: 'Description of the exam type' })
    @IsString()
    @IsOptional()
    description?: string;
}
