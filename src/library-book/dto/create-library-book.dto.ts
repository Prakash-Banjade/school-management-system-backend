import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

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
}
