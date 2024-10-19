import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsUUID } from "class-validator";
import { ELibarryBookStatus } from "src/core/types/global.types";

export class CreateLibraryBookRequestDto {
    @ApiProperty({ type: String, description: 'Library book id', format: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    libraryBookId: string;

    @ApiProperty({ type: String, description: 'Request date', format: 'date-time' })
    @IsDateString()
    requestDate: string;

    @ApiProperty({ type: String, description: 'User id', format: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    userId: string;
}

export class UpdateLibraryBookRequestDto {
    @ApiProperty({ type: String, description: 'Request date', format: 'date-time' })
    @IsDateString()
    @IsOptional()
    requestDate: string;

    @ApiPropertyOptional({ type: String, description: 'Status', enum: ELibarryBookStatus })
    @IsEnum(ELibarryBookStatus)
    @IsOptional()
    status: ELibarryBookStatus;
}