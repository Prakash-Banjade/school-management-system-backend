import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Length, Max, Min } from "class-validator";

export class CreateLibraryBookDto {
    @ApiProperty({ type: String, description: 'Unique code for the book', example: 'BK001' })
    @IsString()
    @IsNotEmpty()
    bookCode: string;

    @ApiProperty({ type: String, description: 'Title of the book', example: 'The Great Gatsby' })
    @IsString()
    @IsNotEmpty()
    bookName: string;

    @ApiProperty({ type: String, description: 'Name of the publisher', example: 'Penguin Books' })
    @IsString()
    @IsOptional()
    publisherName: string;

    @ApiPropertyOptional({ type: String, description: 'Brief description of the book', example: 'A classic novel set in the roaring twenties' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ type: Number, description: 'Year of publication', example: 1925 })
    @IsInt()
    @Max(new Date().getFullYear())
    @Min(new Date().getFullYear() - 100)
    publicationYear: number;

    @ApiProperty({ type: Number, description: 'Number of copies available', example: 10 })
    @IsInt()
    @Min(1)
    copiesCount: number;

    @ApiProperty({ type: String, format: 'uuid', description: 'ID of the book category', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsUUID()
    categoryId: string;
}