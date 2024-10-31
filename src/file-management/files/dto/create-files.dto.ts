import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { HasMimeType, IsFile, MaxFileSize, MemoryStoredFile } from "nestjs-form-data";

export class CreateFileDto {
    @ApiProperty({ type: [String], format: 'binary', description: 'file' })
    @HasMimeType(['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'], { each: true })
    @IsFile({ each: true })
    @MaxFileSize(5 * 1024 * 1024, { each: true })
    @IsNotEmpty({ each: true })
    files: MemoryStoredFile[]

    @ApiProperty()
    @IsString()
    @IsOptional()
    name?: string
}
