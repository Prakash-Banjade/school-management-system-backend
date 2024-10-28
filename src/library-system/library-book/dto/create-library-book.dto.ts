import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Max, Min } from "class-validator";

export class CreateLibraryBookDto {
    @ApiProperty({ type: String, description: 'Book code' })
    @IsString()
    @IsNotEmpty()
    bookCode: string;

    @ApiProperty({ type: String, description: 'Book name' })
    @IsString()
    @IsNotEmpty()
    bookName: string;

    @ApiProperty({ type: String, description: 'Publisher name' })
    @IsString()
    @IsOptional()
    publisherName: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty()
    @IsInt()
    @Max(new Date().getFullYear())
    @Min(new Date().getFullYear() - 100)
    publicationYear: number;

    @ApiProperty()
    @IsInt()
    @Min(1)
    copiesCount: number;
}
