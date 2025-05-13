import { ApiProperty } from "@nestjs/swagger";
import { ArrayMaxSize, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { HasMimeType, IsFile, MaxFileSize, MemoryStoredFile } from "nestjs-form-data";
import { EFileMimeType } from "src/common/types/global.type";

export class CreateFileDto {
    @ApiProperty({ type: [String], format: 'binary', description: 'file' })
    @HasMimeType(Object.values(EFileMimeType), { each: true })
    @IsFile({ each: true })
    @MaxFileSize(5 * 1024 * 1024, { each: true, message: 'File size should be less than 5MB' })
    @IsNotEmpty({ each: true })
    @ArrayMaxSize(5, { message: 'Maximum 5 files allowed' })
    files: MemoryStoredFile[]

    @ApiProperty()
    @IsString()
    @IsOptional()
    name?: string
}
