import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateRecommendationDto {
    @ApiProperty({ type: String, description: 'Title' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ type: String, description: 'Content' })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({ type: String, format: 'uuid', description: 'User id, the recommender' })
    @IsUUID()
    @IsNotEmpty()
    userId: string

    @ApiProperty({ type: String, format: 'date-time', example: '2022-10-18T00:00:00.000Z', description: 'Recommendation date' })
    @IsDateString()
    @IsNotEmpty()
    date: string = new Date().toISOString();
}
