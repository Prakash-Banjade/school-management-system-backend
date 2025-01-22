import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { HasMimeType, IsFile, MaxFileSize, MemoryStoredFile } from "nestjs-form-data";

export class CreateImageDto {
    @ApiProperty({ type: "string", format: 'binary', description: 'Image files', isArray: true })
    @HasMimeType(['image/png', 'image/jpg', 'image/jpeg', 'image/webp'], { each: true })
    @IsFile({ each: true })
    @MaxFileSize(5 * 1024 * 1024, { each: true, message: 'Image size should be less than 5MB' })
    @IsNotEmpty({ each: true })
    images: MemoryStoredFile[]

    @ApiPropertyOptional({ type: "string", description: 'Image name' })
    @IsString()
    @IsOptional()
    name?: string
}
