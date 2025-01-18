import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Length, Max, Min } from "class-validator";

export class CreateLibraryBookDto {
    @ApiProperty({ type: "string", description: 'Book code' })
    @IsString()
    @IsNotEmpty()
    bookCode: string;

    @ApiProperty({ type: "string", description: 'Book name' })
    @IsString()
    @IsNotEmpty()
    bookName: string;

    @ApiProperty({ type: "string", description: 'Publisher name' })
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

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    categoryId: string;
}
